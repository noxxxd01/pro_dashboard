import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

interface IcsItem {
  quantity: number;
  unit?: string;
  description: string;
  unitCost?: number;
  dateAcquired?: string;
  propertyNumber?: string;
  serialNumber?: string;
  estimatedUsefulLife?: string;
  assignedTo?: string;
  remarks?: string;
}

interface IcsData {
  icsNumber: string;
  date: string;
  office: string;
  poNumber?: string;
  province?: string;
  items: IcsItem[];
}

const BLACK = rgb(0, 0, 0);
const LINE_WEIGHT = 0.75;
const MIN_ROWS = 8;
const BASE_ROW_HEIGHT = 22;
const LINE_GAP = 10;
const CELL_FONT_SIZE = 7.5;

// Column order matches the physical ICS form.
const COLUMNS = [
  { label: 'Qty', weight: 0.05 },
  { label: 'Unit', weight: 0.06 },
  { label: 'Description', weight: 0.18 },
  { label: 'Unit Cost', weight: 0.08 },
  { label: 'Date Acquired', weight: 0.1 },
  { label: 'Property No.', weight: 0.1 },
  { label: 'Est. Useful Life', weight: 0.1 },
  { label: 'Assigned/Deployed', weight: 0.15 },
  { label: 'Remarks', weight: 0.18 },
] as const;

// Greedy word-wrap so we can size a row to fit its content instead of
// relying on drawText's built-in maxWidth wrapping, which overflows past a
// fixed row height and bleeds into the row below.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// One printed row within a group. `isHeaderRow` rows carry only a wide
// Description-through-Remarks label (the shared item description) with no
// per-column data; other rows carry one serialized unit's own values.
interface GridRowContent {
  isHeaderRow: boolean;
  descriptionLines: string[];
  unitCost?: string;
  dateAcquired?: string;
  propertyNumber?: string;
  estimatedUsefulLife?: string;
  assignedToLines: string[];
  remarksLines: string[];
}

// A group of rows sharing one Description. Qty and Unit are printed once
// per group, vertically centered across all of the group's rows, instead
// of being repeated on every row.
interface GridGroup {
  qty: string;
  unit: string;
  rows: GridRowContent[];
}

function buildGridGroups(
  items: IcsItem[],
  font: PDFFont,
  descriptionWidth: number,
  mergedDescriptionWidth: number,
  assignedWidth: number,
  remarksWidth: number,
): GridGroup[] {
  const groupsMap = new Map<string, IcsItem[]>();
  const groupOrder: string[] = [];
  for (const item of items) {
    const list = groupsMap.get(item.description);
    if (list) {
      list.push(item);
    } else {
      groupsMap.set(item.description, [item]);
      groupOrder.push(item.description);
    }
  }

  return groupOrder.map((description) => {
    const group = groupsMap.get(description)!;

    if (group.length === 1) {
      const item = group[0];
      return {
        qty: String(item.quantity),
        unit: item.unit ?? '',
        rows: [
          {
            isHeaderRow: false,
            descriptionLines: wrapText(item.description, font, CELL_FONT_SIZE, descriptionWidth),
            unitCost: item.unitCost != null ? item.unitCost.toFixed(2) : '',
            dateAcquired: item.dateAcquired ?? '',
            propertyNumber: item.propertyNumber ?? '',
            estimatedUsefulLife: item.estimatedUsefulLife ?? '',
            assignedToLines: wrapText(item.assignedTo ?? '', font, CELL_FONT_SIZE, assignedWidth),
            remarksLines: wrapText(item.remarks ?? '', font, CELL_FONT_SIZE, remarksWidth),
          },
        ],
      };
    }

    // Grouped units: the shared description gets one wide header row
    // (spanning Description through Remarks); Unit Cost, Date Acquired,
    // Property No., Est. Useful Life, Assigned/Deployed, and Remarks are
    // each unit's own values, aligned to that unit's serial row below.
    const totalQty = group.reduce((sum, item) => sum + item.quantity, 0);
    const first = group[0];
    const headerLines = [
      ...wrapText(description, font, CELL_FONT_SIZE, mergedDescriptionWidth),
      'Serial no./s:',
    ];

    const rows: GridRowContent[] = [
      {
        isHeaderRow: true,
        descriptionLines: headerLines,
        assignedToLines: [],
        remarksLines: [],
      },
      ...group.map((item) => ({
        isHeaderRow: false,
        descriptionLines: [item.serialNumber || '—'],
        unitCost: item.unitCost != null ? item.unitCost.toFixed(2) : '',
        dateAcquired: item.dateAcquired ?? '',
        propertyNumber: item.propertyNumber ?? '',
        estimatedUsefulLife: item.estimatedUsefulLife ?? '',
        assignedToLines: wrapText(item.assignedTo ?? '', font, CELL_FONT_SIZE, assignedWidth),
        remarksLines: wrapText(item.remarks ?? '', font, CELL_FONT_SIZE, remarksWidth),
      })),
    ];

    return { qty: String(totalQty), unit: first.unit ?? '', rows };
  });
}

export async function generateIcsPdf(data: IcsData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]); // US Letter landscape — 9 columns need the width
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 30;
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
    page.drawText(text, { x: x + w / 2 - tw / 2, y: yPos, size, font: useFont });
  };

  let y = height - margin;

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
    'INVENTORY CUSTODIAN SLIP',
    margin,
    tableWidth,
    y - titleRowHeight / 2 - 4,
    12,
  );
  y -= titleRowHeight;

  // ---- Office/PO No. | Province | ICS No./Date row ----
  const infoRowHeight = 30;
  const col1W = tableWidth * 0.38;
  const col2W = tableWidth * 0.3;
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
  page.drawText(`Office: ${data.office}`, {
    x: col1X + 4,
    y: y - 12,
    size: infoLabelSize,
    font,
  });
  page.drawText(`PO No.: ${data.poNumber ?? ''}`, {
    x: col1X + 4,
    y: y - 24,
    size: infoLabelSize,
    font,
  });
  page.drawText(`Province: ${data.province ?? ''}`, {
    x: col2X + 4,
    y: y - 12,
    size: infoLabelSize,
    font,
  });
  page.drawText(`ICS No.: ${data.icsNumber}`, {
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

  // ---- Column geometry (shared by header + data rows) ----
  const colWidths = COLUMNS.map((c) => tableWidth * c.weight);
  const colStartX: number[] = [];
  let cursorX = margin;
  for (const w of colWidths) {
    colStartX.push(cursorX);
    cursorX += w;
  }
  const innerDividers = colStartX.slice(1);
  const descriptionColIndex = 2;

  // ---- Column headers ----
  const colHeaderHeight = 18;
  page.drawRectangle({
    x: margin,
    y: y - colHeaderHeight,
    width: tableWidth,
    height: colHeaderHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });
  innerDividers.forEach((x) => vLine(x, y, y - colHeaderHeight));

  const headerY = y - 12;
  COLUMNS.forEach((col, i) => {
    drawCenteredIn(col.label, colStartX[i], colWidths[i], headerY, 7.5);
  });
  y -= colHeaderHeight;

  // ---- Data rows ----
  const mergedDescriptionWidth = margin + tableWidth - colStartX[descriptionColIndex] - 6;
  const groups = buildGridGroups(
    data.items,
    font,
    colWidths[descriptionColIndex] - 6,
    mergedDescriptionWidth,
    colWidths[7] - 6,
    colWidths[8] - 6,
  );

  // Flatten groups into one row list, remembering which group each row
  // belongs to so Qty/Unit can be merged (drawn once per group) and the
  // Description|...|Remarks divider can be skipped on header rows only.
  interface FlatRow {
    groupIndex: number;
    content: GridRowContent;
    height: number;
  }
  const flatRows: FlatRow[] = [];
  groups.forEach((group, groupIndex) => {
    for (const content of group.rows) {
      const maxLines = Math.max(
        1,
        content.descriptionLines.length,
        content.assignedToLines.length,
        content.remarksLines.length,
      );
      flatRows.push({
        groupIndex,
        content,
        height: Math.max(BASE_ROW_HEIGHT, maxLines * LINE_GAP + 12),
      });
    }
  });
  const blankRowsNeeded = Math.max(0, MIN_ROWS - flatRows.length);
  for (let i = 0; i < blankRowsNeeded; i++) {
    flatRows.push({
      groupIndex: groups.length + i, // each blank row is its own "group" — no merging
      content: {
        isHeaderRow: false,
        descriptionLines: [],
        assignedToLines: [],
        remarksLines: [],
      },
      height: BASE_ROW_HEIGHT,
    });
  }

  const tableTop = y;
  const rowTopYs: number[] = [];
  let cursorY = tableTop;
  for (const row of flatRows) {
    rowTopYs.push(cursorY);
    cursorY -= row.height;
  }
  const tableHeight = tableTop - cursorY;

  page.drawRectangle({
    x: margin,
    y: tableTop - tableHeight,
    width: tableWidth,
    height: tableHeight,
    borderColor: BLACK,
    borderWidth: LINE_WEIGHT,
  });

  // Qty|Unit and Unit|Description dividers always run the full table height
  // — only the columns *after* Description merge away on header rows.
  vLine(colStartX[1], tableTop, tableTop - tableHeight);
  vLine(colStartX[descriptionColIndex], tableTop, tableTop - tableHeight);

  // Description|UnitCost|...|Remarks dividers: skip the segment across any
  // header row (that row is one wide merged cell), draw everywhere else.
  for (let colIdx = descriptionColIndex + 1; colIdx < COLUMNS.length; colIdx++) {
    const x = colStartX[colIdx];
    let segmentStart: number | null = null;
    for (let i = 0; i <= flatRows.length; i++) {
      const isMerged = i < flatRows.length && flatRows[i].content.isHeaderRow;
      if (!isMerged && segmentStart === null) {
        segmentStart = rowTopYs[i];
      }
      if ((isMerged || i === flatRows.length) && segmentStart !== null) {
        const segmentEnd = i < flatRows.length ? rowTopYs[i] : tableTop - tableHeight;
        vLine(x, segmentStart, segmentEnd);
        segmentStart = null;
      }
    }
  }

  // Horizontal dividers: the Qty/Unit span only breaks between different
  // groups (so a group's Qty/Unit reads as one merged cell); the
  // Description-onward span breaks at every row.
  for (let i = 1; i < flatRows.length; i++) {
    const yPos = rowTopYs[i];
    page.drawLine({
      start: { x: colStartX[descriptionColIndex], y: yPos },
      end: { x: margin + tableWidth, y: yPos },
      thickness: 0.5,
      color: BLACK,
    });
    if (flatRows[i].groupIndex !== flatRows[i - 1].groupIndex) {
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: colStartX[descriptionColIndex], y: yPos },
        thickness: 0.5,
        color: BLACK,
      });
    }
  }

  // Qty/Unit — drawn once per group, vertically centered across every row
  // that group spans.
  groups.forEach((group, groupIndex) => {
    const rowIndices = flatRows
      .map((row, i) => (row.groupIndex === groupIndex ? i : -1))
      .filter((i) => i !== -1);
    const groupTop = rowTopYs[rowIndices[0]];
    const groupHeight = rowIndices.reduce((sum, i) => sum + flatRows[i].height, 0);
    const centerY = groupTop - groupHeight / 2 - 3;
    drawCenteredIn(group.qty, colStartX[0], colWidths[0], centerY, 7.5, font);
    drawCenteredIn(group.unit, colStartX[1], colWidths[1], centerY, 7.5, font);
  });

  // Per-row content: Description (or the wide merged header label), and for
  // non-header rows, each unit's own Unit Cost/Date Acquired/Property
  // No./Est. Useful Life/Assigned-Deployed/Remarks.
  flatRows.forEach((row, i) => {
    const rowTop = rowTopYs[i];
    const firstLineY = rowTop - 13;
    const { content } = row;

    content.descriptionLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: colStartX[descriptionColIndex] + 3,
        y: firstLineY - lineIndex * LINE_GAP,
        size: 7.5,
        font,
      });
    });

    if (content.isHeaderRow) return;

    if (content.unitCost) {
      drawCenteredIn(content.unitCost, colStartX[3], colWidths[3], firstLineY, 7.5, font);
    }
    if (content.dateAcquired) {
      drawCenteredIn(content.dateAcquired, colStartX[4], colWidths[4], firstLineY, 7.5, font);
    }
    if (content.propertyNumber) {
      drawCenteredIn(content.propertyNumber, colStartX[5], colWidths[5], firstLineY, 7.5, font);
    }
    if (content.estimatedUsefulLife) {
      drawCenteredIn(content.estimatedUsefulLife, colStartX[6], colWidths[6], firstLineY, 7.5, font);
    }
    content.assignedToLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: colStartX[7] + 3,
        y: firstLineY - lineIndex * LINE_GAP,
        size: 7.5,
        font,
      });
    });
    content.remarksLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: colStartX[8] + 3,
        y: firstLineY - lineIndex * LINE_GAP,
        size: 7.5,
        font,
      });
    });
  });

  y = tableTop - tableHeight;
  y -= 30;

  // ---- Signature blocks: Received by / Issued by ----
  const sigColW = tableWidth / 2;
  const sigColGap = 20;
  const leftX = margin;
  const rightX = margin + sigColW + sigColGap;
  const sigLineWidth = sigColW - sigColGap;

  const drawSignatureBlock = (x: number, heading: string, role: string) => {
    let by = y;
    page.drawText(heading, { x, y: by, size: 9, font: boldFont });
    by -= 40;

    hLine2(x, by, x + sigLineWidth);
    by -= 10;
    drawCenteredIn('(Signature over Printed Name)', x, sigLineWidth, by, 7.5, font);
    by -= 11;
    drawCenteredIn(role, x, sigLineWidth, by, 8, boldFont);
    by -= 26;

    const dateLineWidth = sigLineWidth / 2;
    const dateLineX = x + sigLineWidth / 2 - dateLineWidth / 2;
    hLine2(dateLineX, by, dateLineX + dateLineWidth);
    by -= 10;
    drawCenteredIn('Date', dateLineX, dateLineWidth, by, 7.5, font);
  };

  function hLine2(x1: number, yPos: number, x2: number) {
    page.drawLine({
      start: { x: x1, y: yPos },
      end: { x: x2, y: yPos },
      thickness: 0.5,
      color: BLACK,
    });
  }

  drawSignatureBlock(leftX, 'Received by:', 'Recipient');
  drawSignatureBlock(rightX, 'Issued by:', 'Property Custodian');

  return pdfDoc.save();
}
