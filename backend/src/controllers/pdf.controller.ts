import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import prisma from '../config/prisma';
import { escapeHtml } from '../utils/escapeHtml';
import { isAdminRequester } from '../utils/publicView';

// ==========================================
// 1. RICH TEXT PARSER FOR PUPPETEER HTML ENGINE
// ==========================================
const parseRichText = (text: string | null | undefined): string => {
  if (!text) return 'Data unavailable.';
  return text
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n- (.*)/gim, '<li class="list-item">$1</li>')
    .replace(/\n\n/g, '</p><p class="academic-para">')
    .replace(/\n/g, '<br/>')
    .replace(/<\/h1><br\/>/g, '</h1>')
    .replace(/<\/h2><br\/>/g, '</h2>')
    .replace(/<\/h3><br\/>/g, '</h3>')
    .replace(/<\/li><br\/>/g, '</li>');
};

const buildHtmlTemplate = (post: any, adv: any, methodologyText: string, conclusionText: string): string => `
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { margin: 1in; }
    body { 
      font-family: "Times New Roman", Times, serif; 
      color: #000000; 
      line-height: 1.5; 
      font-size: 11pt; 
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 1px solid #000; 
      padding-bottom: 20px; 
    }
    .title { 
      font-size: 20pt; 
      font-weight: bold; 
      margin: 0 0 15px 0; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    .author { font-size: 12pt; margin-bottom: 5px; }
    .meta { font-size: 10pt; color: #333333; font-style: italic; }
    .abstract-container { 
      margin: 0 40px 30px 40px; 
      text-align: justify; 
      font-size: 10.5pt; 
      font-style: italic; 
    }
    .abstract-label { font-weight: bold; font-style: normal; }
    h2.section-title { 
      font-size: 12pt; 
      font-weight: bold; 
      color: #000000; 
      margin-top: 30px; 
      margin-bottom: 15px; 
      text-transform: uppercase; 
      text-align: center; 
      letter-spacing: 1px; 
    }
    .content-block { margin-bottom: 20px; text-align: justify; }
    .academic-para {
      text-indent: 25px;
      margin: 0 0 10px 0;
      text-align: justify;
    }
    h1 { font-size: 16pt; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-align: center; }
    h2 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 15px; margin-bottom: 10px; font-style: italic; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    .inline-code { 
      background-color: #f1f5f9; 
      padding: 2px 5px; 
      border: 1px solid #e2e8f0; 
      font-family: "Courier New", Courier, monospace; 
      font-size: 10pt; 
    }
    ul, ol { margin-top: 5px; margin-bottom: 15px; padding-left: 40px; }
    .list-item { margin-bottom: 5px; text-align: left; }
    .footer-text { 
      margin-top: 50px; 
      font-size: 9pt; 
      color: #555555; 
      text-align: center; 
      border-top: 1px solid #000; 
      padding-top: 15px; 
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtml(post.title)}</div>
    <div class="author">${escapeHtml(adv.metadata?.writer || 'System Architect')}</div>
    <div class="meta">
      CSxPEDIA SECURE ARCHIVE | CLASSIFICATION: ${escapeHtml(post.type || 'Standard')}<br/>
      DATE: ${new Date(post.createdAt).toLocaleDateString()} | DOI: ${escapeHtml(post.id)}
    </div>
  </div>

  <div class="abstract-container">
    <span class="abstract-label">Abstract—</span><span class="academic-para">${parseRichText(post.content)}</span>
  </div>

  <h2 class="section-title">I. Methodology & Framework</h2>
  <div class="content-block">
    <p class="academic-para">${parseRichText(methodologyText)}</p>
  </div>

  <h2 class="section-title">II. Research Conclusion</h2>
  <div class="content-block">
    <p class="academic-para">${parseRichText(conclusionText)}</p>
  </div>

  <div class="footer-text">
    Document generated automatically via CSxPEDIA Node Gateway.<br/>
    Cryptographically Verified Academic Output.
  </div>
</body>
</html>
`;

// ==========================================
// 2. NATIVE PDF ENGINE (ZERO CHROMIUM / ZERO SYSTEM DEPENDENCIES)
// ==========================================
const stripMarkdown = (text: string | null | undefined): string => {
  if (!text) return 'Data unavailable.';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^-\s+/gm, '• ')
    .trim();
};

export const generateNativeAcademicPDF = (
  post: any,
  adv: any,
  methodologyText: string,
  conclusionText: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 65, left: 55, right: 55 },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = post.title || 'Research Document';
      const writer = adv.metadata?.writer || 'System Architect';
      const classification = post.type || 'Standard';
      const pubDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const doi = post.id;
      const abstract = stripMarkdown(post.content);
      const methodology = stripMarkdown(methodologyText);
      const conclusion = stripMarkdown(conclusionText);

      // Header Banner
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#0284c7')
        .text('CSx MATRIX SECURE ARCHIVE // ACADEMIC SPECIFICATION', { align: 'center', characterSpacing: 1.5 });
      doc.moveDown(0.6);

      // Title
      doc
        .fontSize(16)
        .font('Times-Bold')
        .fillColor('#0f172a')
        .text(title.toUpperCase(), { align: 'center', lineGap: 3 });
      doc.moveDown(0.5);

      // Author & Meta
      doc
        .fontSize(10.5)
        .font('Times-Roman')
        .fillColor('#1e293b')
        .text(writer, { align: 'center' });
      doc.moveDown(0.2);

      doc
        .fontSize(8.5)
        .font('Times-Italic')
        .fillColor('#64748b')
        .text(`CLASSIFICATION: ${classification}   |   DATE: ${pubDate}   |   DOI: ${doi}`, { align: 'center' });
      doc.moveDown(0.8);

      // Divider Line
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(55, doc.y)
        .lineTo(540, doc.y)
        .stroke();
      doc.moveDown(1.2);

      // Abstract Section
      doc
        .fontSize(9.5)
        .font('Times-BoldItalic')
        .fillColor('#0f172a')
        .text('Abstract — ', { continued: true })
        .font('Times-Italic')
        .fillColor('#334155')
        .text(abstract, { align: 'justify', lineGap: 2.5, indent: 15 });
      doc.moveDown(1.5);

      // Section I: Methodology
      doc
        .fontSize(11)
        .font('Times-Bold')
        .fillColor('#0f172a')
        .text('I. METHODOLOGY & ARCHITECTURAL FRAMEWORK', { align: 'left', characterSpacing: 0.5 });
      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Times-Roman')
        .fillColor('#1e293b')
        .text(methodology, { align: 'justify', lineGap: 3, indent: 20 });
      doc.moveDown(1.5);

      // Section II: Conclusion
      doc
        .fontSize(11)
        .font('Times-Bold')
        .fillColor('#0f172a')
        .text('II. RESEARCH FINDINGS & CONCLUSION', { align: 'left', characterSpacing: 0.5 });
      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font('Times-Roman')
        .fillColor('#1e293b')
        .text(conclusion, { align: 'justify', lineGap: 3, indent: 20 });
      doc.moveDown(2);

      // Global Header/Footer & Page Numbers across all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Footer rule line
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(55, 785)
          .lineTo(540, 785)
          .stroke();

        // Footer text
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text(
            'Document generated via CSx Node Gateway • Cryptographically Verified Academic Output',
            55,
            792,
            { align: 'left', width: 380 }
          );

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text(`Page ${i + 1} of ${range.count}`, 440, 792, { align: 'right', width: 100 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ==========================================
// 3. MASTER CONTROLLER DISPATCHER
// ==========================================
export const generateResearchPDF = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  let browser: any = null;

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || (!post.published && !isAdminRequester(req.user))) {
      return res.status(404).json({ message: 'Research document not found.' });
    }

    let adv: any = {};
    if (post.advancedData) {
      try {
        adv = JSON.parse(post.advancedData) || {};
      } catch (e) {
        console.error('Failed to parse advanced data', e);
      }
    }

    const methodologyText = adv.methodology || 'Methodology details were not provided for this document.';
    const conclusionText = adv.conclusion || 'Conclusion details were not provided for this document.';

    let pdfBuffer: Buffer | null = null;

    // Check if Puppeteer should be skipped or attempted
    const forceNative = process.env.USE_NATIVE_PDF === 'true';

    if (!forceNative) {
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
          ],
        });

        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        const html = buildHtmlTemplate(post, adv, methodologyText, conclusionText);
        await page.setContent(html, { waitUntil: 'domcontentloaded' });

        pdfBuffer = Buffer.from(
          await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
          })
        );
      } catch (pupErr: any) {
        console.warn(
          `[PDF ENGINE] Puppeteer launch unavailable in this host environment (${pupErr?.message || 'unknown'}). Falling back seamlessly to Native PDFKit Engine.`
        );
      } finally {
        if (browser) {
          try {
            await browser.close();
          } catch {}
          browser = null;
        }
      }
    }

    // High-performance Native Fallback: Zero Linux dependencies, zero external Chromium binary
    if (!pdfBuffer) {
      pdfBuffer = await generateNativeAcademicPDF(post, adv, methodologyText, conclusionText);
    }

    res.setHeader('Content-Type', 'application/pdf');
    const safeName = (post.title || 'document').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'document';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.pdf"; filename*=UTF-8''${encodeURIComponent(safeName)}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF Engine Fatal Error:', error);
    res.status(500).json({ message: 'Failed to compile the PDF document.' });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
};
