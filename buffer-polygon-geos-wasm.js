import initGeosJs from "./geos.esm.js";

async function bufferPolygonGeosWASM(wktPolygon) {
  console.time("bufferPolygonGeosWASM()");
  const geos = await initGeosJs();
  const reader = geos.GEOSWKTReader_create();

  // Read the WKT string and get a geometry pointer
  const size = wktPolygon.length + 1;
  const wktPtr = geos.Module._malloc(size);
  geos.Module.stringToUTF8(wktPolygon, wktPtr, size);
  const geomPtr = geos.GEOSWKTReader_read(reader, wktPtr);
  geos.Module._free(wktPtr);
  const bufferedPolygon = geos.GEOSBufferWithStyle(
    geomPtr,
    125,
    8,
    geos.GEOSBufCapStyles.GEOSBUF_CAP_ROUND,
    geos.GEOSBufJoinStyles.GEOSBUF_JOIN_ROUND,
    5.0
  );
  const finalPolygon = geos.GEOSBufferWithStyle(
    bufferedPolygon,
    -40,
    8,
    geos.GEOSBufCapStyles.GEOSBUF_CAP_ROUND,
    geos.GEOSBufJoinStyles.GEOSBUF_JOIN_ROUND,
    5.0
  );

  drawPolygon(finalPolygon);

  geos.GEOSGeom_destroy(geomPtr);
  geos.GEOSGeom_destroy(bufferedPolygon);
  geos.GEOSGeom_destroy(finalPolygon);
  console.timeEnd("bufferPolygonGeosWASM()");

  function drawPolygon(data) {
    const scale = 1.98;
    const canvas = document.querySelector('#c-wasm');
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 5;

    ctx.beginPath();

    const numGeometries = geos.GEOSGetNumGeometries(data);
    for (let i = 0; i < numGeometries; i++) {
      const geometry = geos.GEOSGetGeometryN(data, i);
      const ringPtr = geos.GEOSGetExteriorRing(geometry);
      const seq = geos.GEOSGeom_getCoordSeq(ringPtr);

      const sizePtr = geos.Module._malloc(4);

      geos.GEOSCoordSeq_getSize(seq, sizePtr);
      const size = geos.Module.getValue(sizePtr, "i32");
      geos.Module._free(sizePtr);

      for (let i = 0; i < size; i++) {
        const xPtr = geos.Module._malloc(8);
        const yPtr = geos.Module._malloc(8);
        geos.GEOSCoordSeq_getXY(seq, i, xPtr, yPtr);
        const x = geos.Module.getValue(xPtr, "double");
        const y = geos.Module.getValue(yPtr, "double");
        if (i === 0) {
          ctx.moveTo(x / scale, y / scale);
        } else {
          ctx.lineTo(x / scale, y / scale);
        }
        geos.Module._free(xPtr);
        geos.Module._free(yPtr);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
}

window.bufferPolygonGeosWASM = bufferPolygonGeosWASM;
