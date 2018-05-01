import { hasNonHttpsURL, returnsFirstRelativeURL } from '../article-validators';

describe('hasNonHttpsURL', () => {
  it('Returns true if it finds an http (not s) link in an href', () => {
    expect(
      hasNonHttpsURL("<a href='http://www.w3schools.com'> Title'hello'</a>"),
    ).toBe(true);
    expect(
      hasNonHttpsURL(
        "<a href='http://www.w3schools.com/' target='_blank'>Visit W3Schools!</a>",
      ),
    ).toBe(true);
  });
  it('Returns false if it finds an https in an href', () => {
    expect(
      hasNonHttpsURL(
        "http://www.facebook.com<a href='https://www.w3schools.com'> Title'hello'</a>",
      ),
    ).toBe(false);
  });
  it('Returns true if it finds an http (not s) link in an img tag', () => {
    expect(
      hasNonHttpsURL("<img src='http://image.com' alt='Mountain View'>"),
    ).toBe(true);
    expect(
      hasNonHttpsURL(
        "<img src='http://image.com' alt='HTML tutorial' style='width:42px;height:42px;border:0;' align = 'top'>",
      ),
    ).toBe(true);
  });
  it('Returns false if it finds an https in an img tag', () => {
    expect(
      hasNonHttpsURL("<img src='https://image.com' alt='Mountain View'>"),
    ).toBe(false);
  });
  it('Returns false when encountering a url in the text that is not a link', () => {
    expect(hasNonHttpsURL('<p>http://www.google.com</p>')).toBe(false);
    expect(
      hasNonHttpsURL(
        "<a href='https://www.w3schools.com'> Title'http://www.google.com'</a>",
      ),
    ).toBe(false);
  });
  it('Returns true when the link has http, even if another tag has https', () => {
    expect(
      hasNonHttpsURL(
        "<img src='http://image.com' alt='https://smile.com' style='width:42px;height:42px;border:0;' align = 'top'>",
      ),
    ).toBe(true);
  });
});
describe('returnsFirstRelativeURL', () => {
  it('Returns null if there are no relative urls', () => {
    expect(
      returnsFirstRelativeURL(
        "<a href='http://www.w3schools.com'>Visit W3Schools</a>",
      ),
    ).toBe(null);
  });
  it('Returns the first relative url if there is at least one', () => {
    expect(
      returnsFirstRelativeURL("<a href='www.w3schools.com'>Title</a>"),
    ).toBe('www.w3schools.com');
  });
  it('Returns null if an img tag has a relative url', () => {
    expect(
      returnsFirstRelativeURL(
        "<img src='https://image.com' alt='Mountain View'>",
      ),
    ).toBe(null);
    expect(
      returnsFirstRelativeURL(
        "<p>www.youtube.com<p><img src='http://image.com' alt='HTML tutorial' style='width:42px;height:42px;border:0;'>",
      ),
    ).toBe(null);
  });
  it('Returns the first relative url if an image tag', () => {
    expect(
      returnsFirstRelativeURL("<img src='www.image.com' alt='Mountain View'>"),
    ).toBe('www.image.com');
    expect(
      returnsFirstRelativeURL(
        "<img src='www.image.com' alt='HTML tutorial' style='width:42px;border:0;'>",
      ),
    ).toBe('www.image.com');
  });
  it('Returns null when encountering a url in the text that is not a link,', () => {
    expect(returnsFirstRelativeURL('<p>www.google.com</p>')).toBe(null);
    expect(
      returnsFirstRelativeURL(
        "<a href='http://www.w3schools.com'>www.google.com</a>",
      ),
    ).toBe(null);
  });
});
