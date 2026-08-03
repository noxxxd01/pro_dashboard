import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

interface RisItem {
  unit?: string;
  description: string;
  quantity: number;
  remarks?: string;
}

interface Signatory {
  name?: string;
  designation?: string;
}

interface RisData {
  risNumber: string;
  date: string;
  office?: string;
  division?: string;
  cityMunicipality?: string;
  province?: string;
  items: RisItem[];
  purpose?: string;
  requestedBy: Signatory;
  approvedBy: Signatory;
  issuedBy: Signatory;
  receivedBy: Signatory;
}

const BLACK = rgb(0, 0, 0);
const LINE_WEIGHT = 0.75;
const MIN_ROWS = 8;

// Shrinks the font size until text fits maxWidth, so a long typed name or
// designation doesn't overflow its signature-block cell.
function fitFontSize(
  text: string,
  font: PDFFont,
  maxWidth: number,
  startSize: number,
  minSize = 5.5,
) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

export async function generateRisPdf(data: RisData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width } = page.getSize();
  const margin = 40;
  const tableWidth = width - margin * 2;

  const hLine = (yPos: number, thickness = LINE_WEIGHT) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: margin + tableWidth, y: yPos },
      thickness,
      color: BLACK,
    });
  };

  const vLine = (
    x: number,
    yTop: number,
    yBottom: number,
    thickness = LINE_WEIGHT,
  ) => {
    page.drawLine({
      start: { x, y: yTop },
      end: { x, y: yBottom },
      thickness,
      color: BLACK,
    });
  };

  const drawCenteredIn = (
    text: string,
    x: number,
    w: number,
    yPos: number,
    size: number,
    useFont: PDFFont = boldFont,
  ) => {
    const tw = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: x + w / 2 - tw / 2,
      y: yPos,
      size,
      font: useFont,
    });
  };

  let y = 792 - 40;

  // ---- Title bar ----
  const titleRowHeight = 26;
  page.drawRectangle({
    x: margin,
    y: y - titleRowHeight,
    width: tableWidth,
    height: titleRowHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  drawCenteredIn(
    'REQUISITION AND ISSUE SLIP',
    margin,
    tableWidth,
    y - titleRowHeight / 2 - 4,
    12,
  );
  y -= titleRowHeight;

  // ---- Office/Division | City-Municipality/Province | RIS No./Date row ----
  const infoRowHeight = 30;
  const col1W = tableWidth * 0.38;
  const col2W = tableWidth * 0.34;
  const col1X = margin;
  const col2X = margin + col1W;
  const col3X = margin + col1W + col2W;

  page.drawRectangle({
    x: margin,
    y: y - infoRowHeight,
    width: tableWidth,
    height: infoRowHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  vLine(col2X, y, y - infoRowHeight);
  vLine(col3X, y, y - infoRowHeight);

  const infoLabelSize = 8;
  page.drawText(`Office: ${data.office ?? ''}`, {
    x: col1X + 4,
    y: y - 12,
    size: infoLabelSize,
    font,
  });
  page.drawText(`Division: ${data.division ?? ''}`, {
    x: col1X + 4,
    y: y - 24,
    size: infoLabelSize,
    font,
  });
  page.drawText(`City/Municipality: ${data.cityMunicipality ?? ''}`, {
    x: col2X + 4,
    y: y - 12,
    size: infoLabelSize,
    font,
  });
  page.drawText(`Province: ${data.province ?? ''}`, {
    x: col2X + 4,
    y: y - 24,
    size: infoLabelSize,
    font,
  });
  page.drawText(`RIS No.: ${data.risNumber}`, {
    x: col3X + 4,
    y: y - 12,
    size: infoLabelSize,
    font,
  });
  page.drawText(`Date: ${data.date}`, {
    x: col3X + 4,
    y: y - 24,
    size: infoLabelSize,
    font,
  });
  y -= infoRowHeight;

  // ---- Requisition / Issuance section headers ----
  // Split matches the column boundaries below: Requisition = Unit + Description,
  // Issuance = Qty + Remarks (0.18 + 0.5 = 0.68 / 0.12 + remainder = 0.32).
  const sectionHeaderHeight = 16;
  const reqSectionW = tableWidth * 0.68;
  const issSectionW = tableWidth - reqSectionW;
  const reqSectionX = margin;
  const issSectionX = margin + reqSectionW;

  page.drawRectangle({
    x: margin,
    y: y - sectionHeaderHeight,
    width: tableWidth,
    height: sectionHeaderHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  vLine(issSectionX, y, y - sectionHeaderHeight);
  drawCenteredIn('Requisition', reqSectionX, reqSectionW, y - 11, 9);
  drawCenteredIn('Issuance', issSectionX, issSectionW, y - 11, 9);
  y -= sectionHeaderHeight;

  // ---- Column headers: Unit | Description | Qty | Remarks ----
  const colHeaderHeight = 18;
  const unitW = tableWidth * 0.18;
  const descriptionW = tableWidth * 0.5;
  const qtyW = tableWidth * 0.12;
  const remarksW = tableWidth - unitW - descriptionW - qtyW;

  const unitX = margin;
  const descriptionX = unitX + unitW;
  const qtyX = descriptionX + descriptionW;
  const remarksX = qtyX + qtyW;

  page.drawRectangle({
    x: margin,
    y: y - colHeaderHeight,
    width: tableWidth,
    height: colHeaderHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  [descriptionX, qtyX, remarksX].forEach((x) =>
    vLine(x, y, y - colHeaderHeight),
  );

  const headerY = y - 12;
  drawCenteredIn('Unit', unitX, unitW, headerY, 8);
  drawCenteredIn('Description', descriptionX, descriptionW, headerY, 8);
  drawCenteredIn('Qty', qtyX, qtyW, headerY, 8);
  drawCenteredIn('Remarks', remarksX, remarksW, headerY, 8);
  y -= colHeaderHeight;

  // ---- Data rows — one row per requisitioned item, padded with blank
  // rows up to MIN_ROWS so the slip always looks like a complete form ----
  const rowHeight = 22;
  const totalRows = Math.max(MIN_ROWS, data.items.length);
  const tableTop = y;

  page.drawRectangle({
    x: margin,
    y: y - rowHeight * totalRows,
    width: tableWidth,
    height: rowHeight * totalRows,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  [descriptionX, qtyX, remarksX].forEach((x) =>
    vLine(x, tableTop, tableTop - rowHeight * totalRows),
  );
  for (let i = 1; i < totalRows; i++) {
    hLine(tableTop - rowHeight * i, 0.5);
  }

  data.items.forEach((item, i) => {
    const rowTextY = tableTop - rowHeight * i - 14;
    page.drawText(item.unit ?? '', {
      x: unitX + 4,
      y: rowTextY,
      size: 8,
      font,
      maxWidth: unitW - 8,
    });
    page.drawText(item.description, {
      x: descriptionX + 4,
      y: rowTextY,
      size: 8,
      font,
      maxWidth: descriptionW - 8,
    });
    drawCenteredIn(String(item.quantity), qtyX, qtyW, rowTextY, 8, font);
    if (item.remarks) {
      page.drawText(item.remarks, {
        x: remarksX + 4,
        y: rowTextY,
        size: 8,
        font,
        maxWidth: remarksW - 8,
      });
    }
  });

  y = tableTop - rowHeight * totalRows;

  // ---- Purpose box ----
  const purposeHeight = 40;
  page.drawRectangle({
    x: margin,
    y: y - purposeHeight,
    width: tableWidth,
    height: purposeHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  page.drawText('Purpose:', {
    x: margin + 4,
    y: y - 12,
    size: 8,
    font: boldFont,
  });
  if (data.purpose) {
    page.drawText(data.purpose, {
      x: margin + 4,
      y: y - 26,
      size: 8,
      font,
      maxWidth: tableWidth - 8,
    });
  }
  y -= purposeHeight;

  // ---- Signature block: Requested by / Approved by / Issued by / Received by ----
  const sigColW = tableWidth / 4;
  const sigHeaderHeight = 16;
  const sigRowHeight = 18;
  const sigLabels = [
    'Requested by:',
    'Approved by:',
    'Issued by:',
    'Received by:',
  ];
  const sigRowLabels = ['Signature', '', 'Designation', 'Date'];
  const signatories = [
    data.requestedBy,
    data.approvedBy,
    data.issuedBy,
    data.receivedBy,
  ];
  const sigNames = signatories.map((s) => s.name ?? '');
  const sigDesignations = signatories.map((s) => s.designation ?? '');

  page.drawRectangle({
    x: margin,
    y: y - sigHeaderHeight,
    width: tableWidth,
    height: sigHeaderHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  for (let i = 1; i < 4; i++) {
    vLine(margin + sigColW * i, y, y - sigHeaderHeight);
  }
  sigLabels.forEach((label, i) => {
    page.drawText(label, {
      x: margin + sigColW * i + 4,
      y: y - 11,
      size: 8,
      font: boldFont,
    });
  });
  y -= sigHeaderHeight;

  const sigBlockTop = y;
  const sigBlockHeight = sigRowHeight * sigRowLabels.length;
  page.drawRectangle({
    x: margin,
    y: sigBlockTop - sigBlockHeight,
    width: tableWidth,
    height: sigBlockHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  for (let i = 1; i < 4; i++) {
    vLine(margin + sigColW * i, sigBlockTop, sigBlockTop - sigBlockHeight);
  }
  for (let i = 1; i < sigRowLabels.length; i++) {
    hLine(sigBlockTop - sigRowHeight * i, 0.5);
  }

  sigRowLabels.forEach((label, rowIndex) => {
    const rowY = sigBlockTop - sigRowHeight * rowIndex - 12;
    for (let col = 0; col < 4; col++) {
      page.drawText(label, {
        x: margin + sigColW * col + 4,
        y: rowY,
        size: 6.5,
        font,
        color: rgb(0.45, 0.45, 0.45),
      });
      const cellMaxWidth = sigColW - 8;
      if (rowIndex === 1 && sigNames[col]) {
        const nameSize = fitFontSize(sigNames[col], font, cellMaxWidth, 8);
        const nameW = font.widthOfTextAtSize(sigNames[col], nameSize);
        page.drawText(sigNames[col], {
          x: margin + sigColW * col + sigColW / 2 - nameW / 2,
          y: rowY,
          size: nameSize,
          font,
        });
      }
      if (rowIndex === 2 && sigDesignations[col]) {
        const designationSize = fitFontSize(
          sigDesignations[col],
          font,
          cellMaxWidth,
          7.5,
        );
        const designationW = font.widthOfTextAtSize(
          sigDesignations[col],
          designationSize,
        );
        page.drawText(sigDesignations[col], {
          x: margin + sigColW * col + sigColW / 2 - designationW / 2,
          y: rowY,
          size: designationSize,
          font,
        });
      }
    }
  });

  return pdfDoc.save();
}
