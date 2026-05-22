import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Capture a target HTML element and export it as a professional, branded PDF document.
 * 
 * @param {string} elementId - The HTML node ID to capture
 * @param {object} metadata - Metadata information (repoName, dateRange, stats, aiSummary)
 */
export const exportDashboardToPDF = async (elementId, metadata) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Target HTML element with ID "${elementId}" not found.`);
  }

  // Pre-load a temporary loader or alert the user
  console.log('[PDF EXPORT] Capturing dashboard layout screen...');
  
  try {
    // Generate canvas screen capture using html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Double scale for high-res retina grids
      useCORS: true, // Allow cross-origin images (like GitHub avatars)
      backgroundColor: '#0a0f1e', // Enforce dark background color
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create standard A4 Landscape PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // ~297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // ~210mm
    
    // 1. Draw custom branded DevTrackr header
    pdf.setFillColor(7, 14, 25); // #070e19
    pdf.rect(0, 0, pdfWidth, 35, 'F');

    // Logo & Title
    pdf.setTextColor(173, 198, 255); // #adc6ff primary color
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('DevTrackr', 15, 18);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(140, 144, 159); // #8c909f
    pdf.text('AUTOMATED SOFTWARE PRODUCTIVITY REPORT', 15, 26);

    // Repository Details (Right aligned)
    pdf.setTextColor(220, 226, 243); // #dce2f3
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`Repository: ${metadata.repoName || 'N/A'}`, pdfWidth - 15, 16, { align: 'right' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(140, 144, 159);
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    pdf.text(`Generated on: ${dateStr}`, pdfWidth - 15, 23, { align: 'right' });
    if (metadata.language) {
      pdf.text(`Language: ${metadata.language}`, pdfWidth - 15, 29, { align: 'right' });
    }

    // 2. Embed captured dashboard screen
    // Let's preserve padding margins and scale image appropriately
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - 35 - (margin * 2); // Sub-header and margins
    
    // Fit captured image into document limits preserving aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    // Center alignment in document
    const xOffset = margin + (contentWidth - finalWidth) / 2;
    const yOffset = 38 + (contentHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

    // 3. Add a second page detailing AI Report if summary text is present
    if (metadata.aiSummary) {
      pdf.addPage();
      
      // Draw background fill
      pdf.setFillColor(12, 20, 31); // #0c141f
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Secondary header strip
      pdf.setFillColor(7, 14, 25); // #070e19
      pdf.rect(0, 0, pdfWidth, 20, 'F');
      
      pdf.setTextColor(173, 198, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('DevTrackr AI Executive Analysis Summary', 15, 13);
      
      // Draw AI stats card frame
      pdf.setFillColor(25, 32, 43); // #19202b
      pdf.rect(15, 30, pdfWidth - 30, pdfHeight - 50, 'F');
      
      // Sprint Health Badge
      if (metadata.sprintHealth) {
        const healthLabels = {
          'on-track': 'HEALTH: ON TRACK',
          'at-risk': 'HEALTH: AT RISK',
          'blocked': 'HEALTH: BLOCKED'
        };
        pdf.setTextColor(78, 222, 163); // green
        if (metadata.sprintHealth === 'blocked') pdf.setTextColor(239, 68, 68); // red
        if (metadata.sprintHealth === 'at-risk') pdf.setTextColor(245, 158, 11); // amber
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(healthLabels[metadata.sprintHealth] || 'HEALTH: ANALYZING', 25, 45);
      }
      
      // Content body text
      pdf.setTextColor(220, 226, 243); // #dce2f3
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      // Wrap long AI summary string cleanly into paragraph lines
      const splitText = pdf.splitTextToSize(metadata.aiSummary, pdfWidth - 50);
      pdf.text(splitText, 25, 55);
      
      // Action Recommendations
      if (metadata.recommendations && metadata.recommendations.length > 0) {
        const startY = 55 + (splitText.length * 5) + 10;
        pdf.setTextColor(173, 198, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('ACTION RECOMMENDATIONS:', 25, startY);
        
        pdf.setTextColor(220, 226, 243);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        let recY = startY + 7;
        metadata.recommendations.forEach((rec, idx) => {
          if (recY < pdfHeight - 25) {
            pdf.text(`- ${rec}`, 25, recY);
            recY += 6;
          }
        });
      }

      // Add report footer
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(140, 144, 159);
      pdf.text('DevTrackr AI Productivity Platform | google-gemini-2.0-flash insight engine', 15, pdfHeight - 10);
    }

    // Save final PDF
    const filename = `devtrackr-report-${metadata.repoName.replace(/\//g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    console.log('[PDF EXPORT] PDF successfully generated and downloaded!');
  } catch (error) {
    console.error('[PDF EXPORT ERROR] Failed to export PDF:', error);
    throw new Error('PDF Generation failed. Please try again.');
  }
};
