/**
 * BACKEND — Caja de Recuerdos (v4: camino en zigzag en vez de mapa)
 * ---------------------------------------------------------
 * ⚡ PRIMER PASO: corre la función configurarHojas() (ver más abajo) para que
 * cree las pestañas "Lugares" y "Recuerdos" con sus encabezados y listas
 * desplegables automáticamente.
 *
 * HOJA "Lugares":
 * id | nombre | orden | tipo | fechaObjetivo | pistaFecha | password | pistaPassword | desbloqueado | textoDesconocido
 *
 *   - orden: número que define la posición del lugar en el camino
 *     (1, 2, 3... de arriba hacia abajo). No representa fecha ni nada más,
 *     solo el orden en que aparecen los nodos — tú decides el orden.
 *   - textoDesconocido: solo aplica si tipo = "desconocido". Texto libre
 *     que se muestra en vez de "Aún un misterio..." (déjalo vacío para
 *     usar ese texto por defecto).
 *
 * HOJA "Recuerdos":
 * id | lugarId | orden | titulo | imagenUrl | texto | animacion | tipo | fechaObjetivo | pistaFecha | password | pistaPassword | desbloqueado | textoDesconocido
 *
 * NOTA: si ya tenías estas hojas creadas de una versión anterior, la nueva
 * columna "textoDesconocido" se agrega AL FINAL — así no se recorren ni se
 * desalinean las columnas que ya llenaste.
 *
 * En AMBAS hojas, "tipo" acepta: "ninguno" | "fecha" | "password" | "ambos" | "desconocido"
 * Si es "ambos": primero se exige la fecha (pistaFecha); ya pasada, la
 * siguiente vez pide la contraseña (pistaPassword).
 * "desconocido" en un recuerdo = cuadrito "?" no clickeable.
 *
 * Publicación: Extensiones > Apps Script > pega este código > Implementar >
 * Nueva implementación > Aplicación web > Ejecutar como: Yo > Acceso: Cualquiera.
 * Copia la URL /exec y ponla en app.js como API_URL.
 *
 * Imágenes vía Drive: comparte como "cualquiera con el link", copia el ID
 * del archivo y usa: https://drive.google.com/uc?export=view&id=EL_ID_AQUI
 */

function configurarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaSiNoExiste(ss, "Lugares",
    ["id", "nombre", "orden", "tipo", "fechaObjetivo", "pistaFecha", "password", "pistaPassword", "desbloqueado", "textoDesconocido"],
    ["l1", "Donde nos conocimos", 1, "password", "", "", "CAFE2018", "El lugar donde pediste mi número", false, ""]
  );

  crearHojaSiNoExiste(ss, "Recuerdos",
    ["id", "lugarId", "orden", "titulo", "imagenUrl", "texto", "animacion", "tipo", "fechaObjetivo", "pistaFecha", "password", "pistaPassword", "desbloqueado", "textoDesconocido"],
    ["r1", "l1", 1, "El café", "https://drive.google.com/uc?export=view&id=TU_ID_AQUI", "Ese día llovía y...", "corazones-flotantes", "ninguno", "", "", "", "", false, ""]
  );

  SpreadsheetApp.getUi().alert("Listo. Revisa las pestañas 'Lugares' y 'Recuerdos'.");
}

function crearHojaSiNoExiste(ss, nombre, headers, filaEjemplo) {
  let sheet = ss.getSheetByName(nombre);
  const esNueva = !sheet;
  if (esNueva) sheet = ss.insertSheet(nombre);

  const rangoHeaders = sheet.getRange(1, 1, 1, headers.length);
  const headersActuales = rangoHeaders.getValues()[0];
  const faltanHeaders = headers.some((h, i) => headersActuales[i] !== h);
  if (faltanHeaders) {
    rangoHeaders.setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }

  if (esNueva) {
    sheet.getRange(2, 1, 1, filaEjemplo.length).setValues([filaEjemplo]);
    sheet.autoResizeColumns(1, headers.length);
  }

  const tipoCol = headers.indexOf("tipo") + 1;
  if (tipoCol > 0) {
    const reglaTipo = SpreadsheetApp.newDataValidation()
      .requireValueInList(["ninguno", "fecha", "password", "ambos", "desconocido"], true)
      .setAllowInvalid(false).build();
    sheet.getRange(2, tipoCol, 500, 1).setDataValidation(reglaTipo);
  }

  const desbCol = headers.indexOf("desbloqueado") + 1;
  if (desbCol > 0) {
    const reglaBool = SpreadsheetApp.newDataValidation()
      .requireValueInList(["TRUE", "FALSE"], true)
      .setAllowInvalid(false).build();
    sheet.getRange(2, desbCol, 500, 1).setDataValidation(reglaBool);
  }

  if (nombre === "Recuerdos") {
    const animCol = headers.indexOf("animacion") + 1;
    const reglaAnim = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        "confetti-dorado", "corazones-flotantes", "estrella-fugaz", "sobre-abriendose",
        "cortina-teatro", "burbujas", "mariposas", "flor-abriendose", "chispas-picantes", "luz-de-vela"
      ], true)
      .setAllowInvalid(false).build();
    sheet.getRange(2, animCol, 500, 1).setDataValidation(reglaAnim);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lugares = leerHoja(ss, "Lugares");
  const recuerdos = leerHoja(ss, "Recuerdos");
  return responder({ lugares, recuerdos });
}

function leerHoja(ss, nombre) {
  const sheet = ss.getSheetByName(nombre);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data
    .filter(row => row[0] !== "")
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

/**
 * body esperado: { kind: "lugar" | "recuerdo", id, password }
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { kind, id, password } = body;
  const nombreHoja = kind === "recuerdo" ? "Recuerdos" : "Lugares";

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreHoja);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const col = (name) => headers.indexOf(name);

  const idCol = col("id");
  const tipoCol = col("tipo");
  const fechaCol = col("fechaObjetivo");
  const passCol = col("password");
  const desbCol = col("desbloqueado");

  for (let r = 1; r < data.length; r++) {
    if (data[r][idCol] === id) {
      const tipo = data[r][tipoCol];
      let ok = true;

      if (tipo === "fecha" || tipo === "ambos") {
        const objetivo = new Date(data[r][fechaCol]);
        if (new Date() < objetivo) ok = false;
      }
      if (ok && (tipo === "password" || tipo === "ambos")) {
        if (String(password || "").trim().toUpperCase() !== String(data[r][passCol]).trim().toUpperCase()) {
          ok = false;
        }
      }

      if (ok) {
        sheet.getRange(r + 1, desbCol + 1).setValue(true);
        return responder({ ok: true });
      } else {
        return responder({ ok: false, motivo: "no_cumple_condicion" });
      }
    }
  }
  return responder({ ok: false, motivo: "no_encontrado" });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
