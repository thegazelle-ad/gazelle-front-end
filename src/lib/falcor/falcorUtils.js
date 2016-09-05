import React from "react";
import FalcorController from "lib/falcor/FalcorController";

// create a curried createElement that injects a
// falcor model instance into each of the falcon controllers
// also passes a flag that lets the FalcorController know
// if its a server element or not
export function injectModelCreateElement(model) {
  return (Component, props) => {
    if (Component.prototype instanceof FalcorController) {
      return <Component model={model} {...props} />
    } else {
      return <Component {...props} />
    }
  }
}

// Turns to true on the client after the first render is entirely
// completed. Should be set only by the toplevel appController
// after it has mounted
let appReady = false

export function isAppReady() {
  return appReady
}

export function setAppReady() {
  appReady = true
}

export function validateFalcorPathSets(falcorPathSets) {
  /*
  Takes either a single pathSet or an array of pathSets and returns
  a standardized version of an array of falcor pathSets.
  If the component doesn't want any data undefined will be returned which can then be
  handled seperately.
  */

  // If the component doesn't want any data
  if (!falcorPathSets || !(falcorPathSets instanceof Array) || falcorPathSets.length === 0) {
    return undefined;
  }
  // If we're only passing a single pathSet we compensate for the spread operator
  if (!(falcorPathSets[0] instanceof Array)) {
    return [falcorPathSets];
  }
  return falcorPathSets;
}

function followPath(path, object) {
  /*
  Returns the value at the end of a path at a given object
  */

  // If using dot notation obj.key.key.key
  if (typeof path === "string") {
    path = path.split('.');
  }
  return path.reduce((currentObject, nextChild) => {
    if (currentObject !== undefined && currentObject.hasOwnProperty(nextChild)) {
      return currentObject[nextChild];
    }

    return undefined;
  }, object);
}

let getCacheMemo = {};

export function getCache(model, falcorPathSets, expandCacheFlag) {
  // Get the cache but with memoization included
  let pathSetString = JSON.stringify(falcorPathSets);
  // if pathSets argument is left out we fetch full cache
  if (falcorPathSets === undefined) {
    pathSetString = 'fullCache';
  }
  if (getCacheMemo.hasOwnProperty(pathSetString)) {
    return getCacheMemo[pathSetString];
  }
  else {
    if (falcorPathSets !== undefined){
      if (!expandCacheFlag) {
        return getCacheMemo[pathSetString] = model.getCache(...falcorPathSets);
      }
      else {
        return getCacheMemo[pathSetString] = expandCache(model.getCache(...falcorPathSets));
      }
    }
    else {
      if (!expandCacheFlag) {
        return getCacheMemo[pathSetString] = model.getCache();
      }
      else {
        return getCacheMemo[pathSetString] = expandCache(model.getCache());
      }
    }
  }
}

export function resetCacheMemoization() {
  pathSetsInCacheMemo = {};
  getCacheMemo = {};
}

let pathSetsInCacheMemo = {};

export function pathSetsInCache(model, falcorPathSets) {
  /*
  Checks if falcorPathSets in given cache
  */

  function handleCheckingSingleKey(curObject, nextRemainingKeySets, key) {
    /*
    This function modularizes the checking of a single key.
    It takes as arguments the current object level we are at,
    the key we are checking and the remainingKeySets argument
    for the next call of checkSinglePathSetsInCache.
    It returns whether this key and all branches from the pathSet that follow
    this key are in the cache as it continues recursively.
    */
    if (!curObject.hasOwnProperty(key)) {
      return false;
    }
    else {
      const val = curObject[key];
      if (val.$type) {
        switch (val.$type) {
          case "error":
          case "atom":
            return nextRemainingKeySets.length === 0;
          case "ref":
            return checkSinglePathSetInCache(followPath(val.value, cache), nextRemainingKeySets);
          default:
            throw new Error("pathSetsInCache encountered unexpected type. Type found was: " + val.$type);
        }
      }
      else {
        return checkSinglePathSetInCache(val, nextRemainingKeySets);
      }
    }
  }

  function checkSinglePathSetInCache(curObject, remainingKeySets) {
    /*
    Checks if a single pathSet is in the cache recursively.
    Since it is recursive it not only takes the initial values of
    the cache and a falcor pathSet, but also the current level of
    the object one has reached, and the remaining keySets in the
    current falcor pathSet.
    */
    if (remainingKeySets.length === 0) {
      return true;
    }
    const nextRemainingKeySets = remainingKeySets.slice(1);
    let nextKeySet = remainingKeySets[0];
    // This is to avoid code duplication for when
    // it is just a single key instead of an
    // array of keys. We don't want to handle that
    // case seperately so just make an array with one value
    if (!(nextKeySet instanceof Array)) {
      nextKeySet = [nextKeySet];
    }
    return nextKeySet.every((keyOrRange) => {
      if (keyOrRange !== null && typeof keyOrRange === "object") {
        // keyOrRange is a range
        let start = 0;
        if (keyOrRange.hasOwnProperty("from")) {
          start = keyOrRange.from;
        }
        let end;
        if (keyOrRange.hasOwnProperty("to")) {
          if (keyOrRange.hasOwnProperty("length")) {
            throw new Error("Falcor Range cannot have both 'to' and 'length' properties at falcor KeySet: " + JSON.stringify(keyOrRange));
          }
          end = keyOrRange.to;
        }
        else if (keyOrRange.hasOwnProperty("length")) {
          end = start+keyOrRange.length-1;
        }
        else {
          throw new Error("Falcor Range must have either 'to' or 'length' properties at falcor KeySet: " + JSON.stringify(keyOrRange));
        }
        for (let i = start; i <= end; i++) {
          if (!handleCheckingSingleKey(curObject, nextRemainingKeySets, i)) {
            return false;
          }
        }
        return true;
      }
      else {
        // keyOrRange is a simple key
        return handleCheckingSingleKey(curObject, nextRemainingKeySets, keyOrRange);
      }
    });
  }

  // Here function starts
  falcorPathSets = validateFalcorPathSets(falcorPathSets);
  if (falcorPathSets === undefined) {
    // If no data is being requested return true
    return true;
  }
  // Check that we don't have the result memoized
  let pathSetString = JSON.stringify(falcorPathSets);
  if (pathSetsInCacheMemo.hasOwnProperty(pathSetString)) {
    return pathSetsInCacheMemo[pathSetString]
  }

  // If we don't have it memoized then get the cache
  let cache = getCache(model);

  // Return if every pathSet in the array of pathSets
  // is located in the cache and memoize result.
  return pathSetsInCacheMemo[pathSetString] = falcorPathSets.every((pathSet) => {
    return checkSinglePathSetInCache(cache, pathSet);
  });
}

export function expandCache(cache) {
  function assignByPath(path, value) {
    // If using dot notation obj.key.key.key
    if (typeof path === "string") {
      path = path.split('.');
    }
    // Parent also works for array length 1, aka initial keys
    // Parent and Key variables are used for assigning new values later
    const parent = followPath(path.slice(0, path.length-1), cache);
    const key = path[path.length-1];
    // The following key exists as it was pushed on to stack as a valid key
    parent[key] = value;
  }

  function isObject(val) {
    // We don't count arrays as objects here. This is to protect ourselves against an expanded atom
    // This does still leave us vulnerable to an expanded object though, but in by far most cases
    // it would be very bad form to put an object in an atom, so this is not supported at this time.
    if (val === null || (val instanceof Array)) return false;
    return typeof val === "object";
  }

  function handleRef(pathToRef, refPath) {
    const refPathsSet = new Set();
    // pathToRef is an array path
    if (!(pathToRef instanceof Array)) {
      throw new Error("pathToRef was passed as a non-array. The value passed was: " + JSON.stringify(pathToRef));
    }
    // So is refPath
    if (!(pathToRef instanceof Array)) {
      throw new Error("refPath was passed as a non-array. The value passed was: " + JSON.stringify(refPath));
    }
    refPathsSet.add(pathToRef.join('.'));
    let val = followPath(refPath, cache);
    let path = refPath.join('.');
    if (val === undefined) {
      throw new Error("Missing part of JSON graph in expandCache function at path: " + path);
    }
    while (isObject(val) && val.$type) {
      switch (val.$type) {
        case "atom":
          assignByPath(path, val.value);
          val = followPath(path, cache);
          break;
        case "error":
          assignByPath(path, new Error(val.value));
          val = followPath(path, cache);
          break;
        case "ref":
          if (refPathsSet.has(path)) {
            let paths = "[";
            refPathsSet.forEach((pathFromSet) => {
              paths += pathFromSet + ", ";
            });
            paths = paths.substring(0, paths.length-2) + ']';
            throw new Error("Neverending loop from ref to ref with no real values present in expandCache. It is made up of the following paths: " + paths)
          }
          else {
            refPathsSet.add(path);
            path = val.value.join('.');
            val = followPath(val.value, cache);
          }
          break;
        default:
          throw new Error("expandCache encountered a new type of name: " + val.$type + ". And cannot read it at following path: " + path);
      }
    }
    refPathsSet.forEach((pathFromSet) => {
      assignByPath(pathFromSet, val);
    });
  }

  // If empty return itself
  if (!cache) return cache;
  // Expanding
  const stack = [];
  Object.keys(cache).forEach((key) => {
    stack.push([key]);
  });
  while (stack.length > 0) {
    // pathArray is the path to the current location being checked
    // and is an array with the keys in order of how they should be accessed
    // it is always an array as we only push arrays onto the stack
    const pathArray = stack.pop();
    if (!(pathArray instanceof Array)) {
      throw new Error("non-array popped off stack in expandCache. Item popped off was: " + JSON.stringify(pathArray));
    }
    const val = followPath(pathArray, cache);
    if (val === undefined) {
      throw new Error("Missing part of JSON graph in expandCache function at path: " + pathArray.join('.'));
    }
    if (!isObject(val)) {
      continue;
    }
    else if (val.$type) {
      switch (val.$type) {
        case "atom":
          assignByPath(pathArray, val.value);
          break;
        case "error":
          assignByPath(pathArray, new Error(val.value));
          break;
        case "ref":
          handleRef(pathArray, val.value);
          break;
        default:
          throw new Error("expandCache encountered a new type of name: " + val.$type + ". And cannot read it at following path: " + pathArray.join('.'));
      }
    }
    else{
      Object.keys(val).forEach((key) => {
        const next = pathArray.concat(key);
        stack.push(next);
      });
    }
  };
  return cache;
}
