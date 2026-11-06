const rad = Math.PI / 180;
/** @param {number} angle */
export function wrapDegrees(angle) {
  return ((angle % 360) + 360) % 360;
}
/** Local mean sidereal angle in degrees. @param {Date} date @param {number} longitude */
export function siderealDegrees(date, longitude) {
  const jd = date.getTime() / 86400000 + 2440587.5,
    t = (jd - 2451545) / 36525;
  return wrapDegrees(
    280.46061837 +
      360.98564736629 * (jd - 2451545) +
      0.000387933 * t * t -
      (t * t * t) / 38710000 +
      longitude,
  );
}
/** J2000 mean coordinates precessed to date; proper motion and refraction omitted.
 * @param {number} ra @param {number} dec @param {Date} date */
export function precessJ2000(ra, dec, date) {
  const t = (date.getTime() / 86400000 + 2440587.5 - 2451545) / 36525,
    zeta =
      ((2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) / 3600) * rad,
    z = ((2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) / 3600) * rad,
    theta =
      ((2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) / 3600) * rad;
  const a = Math.cos(dec * rad) * Math.sin(ra * rad + zeta),
    b =
      Math.cos(theta) * Math.cos(dec * rad) * Math.cos(ra * rad + zeta) -
      Math.sin(theta) * Math.sin(dec * rad),
    c =
      Math.sin(theta) * Math.cos(dec * rad) * Math.cos(ra * rad + zeta) +
      Math.cos(theta) * Math.sin(dec * rad);
  return {
    ra: wrapDegrees(Math.atan2(a, b) / rad + z / rad),
    dec: Math.asin(Math.max(-1, Math.min(1, c))) / rad,
  };
}
/** North-up celestial projection; east lies to the left.
 * @param {number} ra @param {number} dec @param {number} centerRa @param {number} centerDec */
export function projectStar(ra, dec, centerRa, centerDec) {
  const d = (ra - centerRa) * rad,
    c = dec * rad,
    lat = centerDec * rad;
  return {
    x: -Math.cos(c) * Math.sin(d),
    y: -(
      Math.cos(lat) * Math.sin(c) -
      Math.sin(lat) * Math.cos(c) * Math.cos(d)
    ),
    z: Math.sin(lat) * Math.sin(c) + Math.cos(lat) * Math.cos(c) * Math.cos(d),
  };
}
/** @param {number} ra @param {number} dec @param {number} latitude @param {number} longitude @param {Date} date */
export function horizontalPosition(ra, dec, latitude, longitude, date) {
  const h = (siderealDegrees(date, longitude) - ra) * rad,
    d = dec * rad,
    p = latitude * rad;
  const altitude =
    Math.asin(
      Math.max(
        -1,
        Math.min(
          1,
          Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h),
        ),
      ),
    ) / rad;
  const azimuth = wrapDegrees(
    Math.atan2(
      -Math.sin(h) * Math.cos(d),
      Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(h),
    ) / rad,
  );
  return { altitude, azimuth };
}
/** @param {number} longitude @param {number} latitude */
export function galacticToEquatorial(longitude, latitude = 0) {
  const l = longitude * rad,
    b = latitude * rad,
    x = Math.cos(b) * Math.cos(l),
    y = Math.cos(b) * Math.sin(l),
    z = Math.sin(b);
  const ex = -0.0548755604 * x + 0.4941094279 * y - 0.867666149 * z,
    ey = -0.8734370902 * x - 0.44482963 * y - 0.1980763734 * z,
    ez = -0.4838350155 * x + 0.7469822445 * y + 0.4559837762 * z;
  return {
    ra: wrapDegrees(Math.atan2(ey, ex) / rad),
    dec: Math.asin(Math.max(-1, Math.min(1, ez))) / rad,
  };
}
