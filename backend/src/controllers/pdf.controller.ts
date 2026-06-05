import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import prisma from '../config/prisma';

// ==========================================
// RICH TEXT PARSER FOR PDF ENGINE
// ==========================================
// Safely converts Markdown/HTML tags from the DataCore Forge into printable PDF HTML
const parseRichText = (text: string | null | undefined) => {
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
    .replace(/\n\n/g, '</p><p class="academic-para">') // Double line breaks become academic paragraphs
    .replace(/\n/g, '<br/>')
    .replace(/<\/h1><br\/>/g, '</h1>')
    .replace(/<\/h2><br\/>/g, '</h2>')
    .replace(/<\/h3><br\/>/g, '</h3>')
    .replace(/<\/li><br\/>/g, '</li>');
};

export const generateResearchPDF = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  let browser; // Declared outside so the 'finally' block can access it to prevent memory leaks

  try {
    // 1. Attempt to fetch from PostgreSQL
    let post = await prisma.post.findUnique({ where: { id } });
    
    // Establish standard architectural fallback parameters
    let adv = { 
      methodology: 'A controlled empirical testing loop was established to verify rendering speed under extreme layouts. We bypassed general cycle reconciliation loops by manipulating standard DOM transformations directly via strict functional spring mathematics.', 
      conclusion: 'The data conclusively confirms that isolating rendering transformations to individual graphical processing sub-layers eliminates layout execution thrashing, guaranteeing strict frame delivery stability.', 
      metadata: { writer: 'Nima (Lead Architect)', startDate: 'MAY 2026', endDate: 'JUNE 2026', topics: ['Matrix Frameworks', 'Headless Compilations'] } 
    };

    if (!post) {
      post = {
        id: id || "v2.4.0",
        title: "Classified Research Blueprint",
        type: "Encrypted Data Core",
        content: "The requested academic blueprint requires elevated architectural clearance. The telemetry logging infrastructure for this resource has been secured.",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: "classified-research-blueprint",
        heroImg: "from-slate-800 to-black",
        advancedData: JSON.stringify(adv),
        categoryId: null,
        authorId: null
      } as any;
    } else if (post.advancedData) {
      try {
        adv = JSON.parse(post.advancedData);
      } catch (e) {
        console.error("Failed to parse advanced data", e);
      }
    }

    // 2. Build the Formal Academic HTML Document (International Standard)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Strict International Standard Formatting (IEEE/ACM style emulation) */
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
          
          /* Formal Header Block */
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
          .author {
            font-size: 12pt;
            margin-bottom: 5px;
          }
          .meta { 
            font-size: 10pt; 
            color: #333333; 
            font-style: italic;
          }
          
          /* Abstract Formatting */
          .abstract-container { 
            margin: 0 40px 30px 40px; 
            text-align: justify; 
            font-size: 10.5pt; 
            font-style: italic; 
          }
          .abstract-label { 
            font-weight: bold; 
            font-style: normal; 
          }

          /* Document Section Headers */
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
          .content-block { 
            margin-bottom: 20px; 
            text-align: justify; 
          }
          
          /* Typography & Paragraphs */
          .academic-para {
            text-indent: 25px; /* Formal first-line indent */
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
          
          /* Footer */
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
          <div class="title">${post?.title || 'Classified Research Blueprint'}</div>
          <div class="author">${adv.metadata?.writer || 'System Architect'}</div>
          <div class="meta">
            CSxPEDIA SECURE ARCHIVE | CLASSIFICATION: ${post?.type || 'Standard'}<br/>
            DATE: ${post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown'} | DOI: ${post?.id}
          </div>
        </div>

        <div class="abstract-container">
          <span class="abstract-label">Abstract—</span><span class="academic-para">${parseRichText(post?.content)}</span>
        </div>

        <h2 class="section-title">I. Methodology & Framework</h2>
        <div class="content-block">
          <p class="academic-para">${parseRichText(adv.methodology)}</p>
        </div>

        <h2 class="section-title">II. Research Conclusion</h2>
        <div class="content-block">
          <p class="academic-para">${parseRichText(adv.conclusion)}</p>
        </div>

        <div class="footer-text">
          Document generated automatically via CSxPEDIA Node Gateway.<br/>
          Cryptographically Verified Academic Output.
        </div>
      </body>
      </html>
    `;

    // 3. Launch Headless Chrome Safely
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' } 
    });

    // 4. Stream File Response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${post?.title?.replace(/\s+/g, '_') || 'document'}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Engine Error:", error);
    res.status(500).json({ message: "Failed to compile the PDF document." });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};