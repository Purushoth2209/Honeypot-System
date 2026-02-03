# PDF Report Generation Feature

## Overview

The dashboard now includes a professional PDF report generation feature that creates comprehensive security reports with all attack analytics.

## Features

### Report Sections

1. **Executive Summary**
   - Report generation timestamp
   - Analysis period
   - Total logs analyzed
   - Threats detected
   - Unique attackers

2. **Severity Breakdown**
   - Table with severity levels (Critical, High, Medium, Low)
   - Count and percentage for each severity
   - Color-coded severity indicators

3. **Attack Vectors**
   - All detected attack types
   - Incident counts
   - Severity levels
   - Risk percentage distribution

4. **Top Threat Actors**
   - Top 5 attackers by threat score
   - IP addresses
   - Behavior classification
   - Attack counts and techniques used
   - Color-coded severity boxes

5. **Detection Details**
   - Up to 10 most recent detections
   - Rule names and IDs
   - Source IPs
   - Matched log counts
   - Severity indicators

## Design Features

- **Professional Template**: Clean, modern design with color-coded severity levels
- **Multi-page Support**: Automatically handles pagination
- **Color Scheme**: Matches dashboard theme (slate/rose colors)
- **Headers & Footers**: Branded header on first page, page numbers on all pages
- **Tables**: Auto-formatted tables with alternating row colors
- **Typography**: Clear hierarchy with bold headings and readable body text

## Usage

### From Dashboard

Click the **"Download PDF Report"** button in the top-right corner of the dashboard.

The PDF will be automatically downloaded with filename format:
```
honeypot-report-YYYY-MM-DD.pdf
```

### Programmatic Usage

```typescript
import { PDFReportService } from './services/pdfReportService';

const pdfService = new PDFReportService();
pdfService.generateReport(summary, attacks, attackers, detections);
pdfService.download('custom-filename.pdf');

// Or get as blob for upload
const blob = pdfService.getBlob();
```

## Technical Details

### Dependencies

- **jspdf**: Core PDF generation library
- **jspdf-autotable**: Table generation plugin

### File Structure

```
Dashboard/
└── services/
    └── pdfReportService.ts  # PDF generation service
```

### Color Coding

| Severity | Color | RGB |
|----------|-------|-----|
| Critical | Red | (220, 38, 38) |
| High | Orange | (249, 115, 22) |
| Medium | Yellow | (234, 179, 8) |
| Low | Green | (34, 197, 94) |

## Customization

### Change Template Colors

Edit `pdfReportService.ts`:

```typescript
// Header background
this.doc.setFillColor(15, 23, 42); // Change RGB values

// Accent color
this.doc.setFillColor(248, 113, 113); // Change RGB values
```

### Add Custom Sections

```typescript
// In generateReport method
this.addSection('CUSTOM SECTION');
this.addKeyValue('Custom Key', 'Custom Value');
```

### Modify Table Styles

```typescript
autoTable(this.doc, {
  headStyles: { 
    fillColor: [15, 23, 42],  // Header background
    textColor: [255, 255, 255] // Header text
  },
  alternateRowStyles: { 
    fillColor: [248, 250, 252] // Alternate row color
  }
});
```

## Example Output

The generated PDF includes:
- 3+ pages of comprehensive security analysis
- Professional formatting with consistent branding
- Color-coded severity indicators throughout
- Detailed tables and statistics
- Timestamp and page numbers on every page

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Performance

- Generation time: < 1 second for typical reports
- File size: ~50-200 KB depending on data volume
- No server-side processing required (client-side generation)

## Future Enhancements

Potential improvements:
- [ ] Add charts/graphs to PDF
- [ ] Include timeline visualization
- [ ] Add executive summary with AI insights
- [ ] Support for custom date ranges
- [ ] Email report functionality
- [ ] Scheduled report generation
