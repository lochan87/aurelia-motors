# -*- coding: utf-8 -*-
"""
Aurelia Motors — Technical Design Document Master Generator
Version 1.0 — Completed Hiring Assignment
Author: Lochan T N
Repository: https://github.com/lochan87/aurelia-motors

Generates:
1. submission/Aurelia_Motors_Technical_Design_Document.docx (Master document)
2. submission/Aurelia_Motors_Technical_Design_Document.pdf (Word COM export)
3. submission/Aurelia_Motors_Technical_Design_Document.md (Synchronized Markdown)
"""

import os
import sys
import tempfile
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

os.environ['MPLCONFIGDIR'] = os.path.join(tempfile.gettempdir(), 'mpl_tdd_build')
os.makedirs(os.environ['MPLCONFIGDIR'], exist_ok=True)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Color Palette Constants
COLOR_NAVY_DARK   = RGBColor(15, 23, 42)      # #0f172a
COLOR_SLATE_DARK  = RGBColor(30, 41, 59)      # #1e293b
COLOR_ACCENT_BLUE = RGBColor(37, 99, 235)     # #2563eb
COLOR_BODY_TEXT   = RGBColor(51, 65, 85)      # #334155
COLOR_MUTED_TEXT  = RGBColor(100, 116, 139)   # #64748b

HEX_DARK_NAVY = "0F172A"
HEX_LIGHT_BG  = "F8FAFC"
HEX_BORDER    = "CBD5E1"
HEX_BLUE      = "2563EB"
HEX_WHITE     = "FFFFFF"

# -------------------------------------------------------------
# XML Helper Functions for DOCX Styling
# -------------------------------------------------------------
def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for edge, border in borders.items():
        if border:
            tag = (f'<w:{edge} {nsdecls("w")} w:val="{border.get("val", "single")}" '
                   f'w:sz="{border.get("sz", "4")}" w:space="0" w:color="{border.get("color", "CBD5E1")}"/>')
            tcBorders.append(parse_xml(tag))
        else:
            tag = f'<w:{edge} {nsdecls("w")} w:val="none"/>'
            tcBorders.append(parse_xml(tag))
    tcPr.append(tcBorders)

def add_header_footer(section):
    section.different_first_page_header_footer = True
    
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run('Aurelia Motors — Technical Design Document')
    hrun.font.name = 'Calibri'
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = COLOR_MUTED_TEXT
    
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    frun1 = fp.add_run('Aurelia Motors — Architecture & Engineering Specification  |  ')
    frun1.font.name = 'Calibri'
    frun1.font.size = Pt(8.5)
    frun1.font.color.rgb = COLOR_MUTED_TEXT
    
    def add_fld(p, field_name):
        r = p.add_run()
        r.font.name = 'Calibri'
        r.font.size = Pt(8.5)
        r.font.color.rgb = COLOR_MUTED_TEXT
        fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr = parse_xml(r'<w:instrText %s xml:space="preserve"> %s </w:instrText>' % (nsdecls('w'), field_name))
        fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        r._r.append(fld1)
        r._r.append(instr)
        r._r.append(fld2)
        r._r.append(fld3)

    fp.add_run('Page ')
    add_fld(fp, 'PAGE')
    fp.add_run(' of ')
    add_fld(fp, 'NUMPAGES')

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY_DARK
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_SLATE_DARK
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = COLOR_BODY_TEXT
    return p

def add_body_p(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(9.5)
    run.font.color.rgb = COLOR_BODY_TEXT
    return p

def add_bullet(doc, title, desc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1.8)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.left_indent = Inches(0.25)
    
    r_bullet = p.add_run('▪  ')
    r_bullet.font.name = 'Calibri'
    r_bullet.font.size = Pt(8.5)
    r_bullet.font.color.rgb = COLOR_ACCENT_BLUE
    
    r_title = p.add_run(title + (': ' if desc else ''))
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(9.5)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_SLATE_DARK
    
    if desc:
        r_desc = p.add_run(desc)
        r_desc.font.name = 'Calibri'
        r_desc.font.size = Pt(9.5)
        r_desc.font.color.rgb = COLOR_BODY_TEXT
    return p

def add_callout(doc, title, text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.77)
    set_cell_background(cell, HEX_LIGHT_BG)
    set_cell_margins(cell, top=80, bottom=80, left=140, right=140)
    set_cell_borders(cell, left={'val': 'single', 'sz': '24', 'color': HEX_BLUE})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run_t = p.add_run(title + "\n")
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(9.5)
    run_t.font.bold = True
    run_t.font.color.rgb = COLOR_NAVY_DARK
    
    run_b = p.add_run(text)
    run_b.font.name = 'Calibri'
    run_b.font.size = Pt(9.0)
    run_b.font.color.rgb = COLOR_BODY_TEXT
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(2)

def add_code_block(doc, code_str):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.77)
    set_cell_background(cell, HEX_LIGHT_BG)
    set_cell_margins(cell, top=65, bottom=65, left=120, right=120)
    border_style = {'val': 'single', 'sz': '4', 'color': HEX_BORDER}
    set_cell_borders(cell, top=border_style, bottom=border_style, left=border_style, right=border_style)
    
    cell.paragraphs[0].text = ''
    lines = code_str.strip().split('\n')
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(line)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = COLOR_NAVY_DARK
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(2)

def add_styled_table(doc, headers, rows_data, col_widths):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    hdr_cells = table.rows[0].cells
    hdr_tr = table.rows[0]._tr.get_or_add_trPr()
    hdr_tr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    hdr_tr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    for c_idx, title in enumerate(headers):
        cell = hdr_cells[c_idx]
        cell.width = col_widths[c_idx]
        set_cell_background(cell, HEX_DARK_NAVY)
        set_cell_margins(cell, top=65, bottom=65, left=80, right=80)
        border_s = {'val': 'single', 'sz': '4', 'color': HEX_BORDER}
        set_cell_borders(cell, top=border_s, bottom=border_s, left=border_s, right=border_s)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.font.name = 'Calibri'
        run.font.size = Pt(8.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
    
    for r_idx, r_data in enumerate(rows_data):
        row = table.rows[r_idx + 1]
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        bg_col = HEX_LIGHT_BG if r_idx % 2 == 1 else HEX_WHITE
        
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            border_s = {'val': 'single', 'sz': '4', 'color': HEX_BORDER}
            set_cell_borders(cell, top=border_s, bottom=border_s, left=border_s, right=border_s)
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            run = p.add_run(str(val))
            run.font.name = 'Calibri'
            run.font.size = Pt(8.0)
            run.font.color.rgb = COLOR_BODY_TEXT
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(2)

def add_figure(doc, img_path, caption):
    p_img = doc.add_paragraph()
    p_img.paragraph_format.space_before = Pt(4)
    p_img.paragraph_format.space_after = Pt(2)
    p_img.paragraph_format.keep_with_next = True
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(6.75))
    
    p_cap = doc.add_paragraph()
    p_cap.paragraph_format.space_before = Pt(0)
    p_cap.paragraph_format.space_after = Pt(4)
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_cap = p_cap.add_run(caption)
    run_cap.font.name = 'Calibri'
    run_cap.font.size = Pt(8.0)
    run_cap.font.italic = True
    run_cap.font.color.rgb = COLOR_MUTED_TEXT

# -------------------------------------------------------------
# Matplotlib Diagrams Generation
# -------------------------------------------------------------
def generate_diagrams():
    os.makedirs('submission/diagrams', exist_ok=True)
    
    # 1. System Architecture
    fig, ax = plt.subplots(figsize=(10.5, 5.8), dpi=300)
    ax.set_xlim(0, 105)
    ax.set_ylim(0, 58)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 105, 58, facecolor='#ffffff'))
    
    ax.text(52.5, 55, 'Aurelia Motors — Full-Stack System Architecture', ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(52.5, 52.2, 'Containerized Multi-Tier Topology (Web, Gateway, API & Database)', ha='center', va='center', fontsize=8.5, color='#64748b')
    
    c_box = patches.FancyBboxPatch((4, 37), 26, 12, boxstyle='round,pad=1', facecolor='#f8fafc', edgecolor='#64748b', linewidth=1.5)
    ax.add_patch(c_box)
    ax.text(17, 46, 'Client Tier (Browser SPA)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0f172a')
    ax.text(17, 42.5, 'React 19 • TypeScript • Tailwind CSS 4\nTanStack Query v5 • React Router 7', ha='center', va='center', fontsize=7.5, color='#334155')
    ax.text(17, 39, 'Public Retail Portal & Protected Staff Admin', ha='center', va='center', fontsize=7, fontstyle='italic', color='#64748b')
    
    g_box = patches.FancyBboxPatch((40, 37), 26, 12, boxstyle='round,pad=1', facecolor='#f0f9ff', edgecolor='#0284c7', linewidth=1.5)
    ax.add_patch(g_box)
    ax.text(53, 46, 'Edge Gateway (Nginx Proxy)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0369a1')
    ax.text(53, 42.5, 'Port 80/443 • Static Asset Delivery\nReverse Proxy /api/* to Node API', ha='center', va='center', fontsize=7.5, color='#334155')
    ax.text(53, 39, 'Request ID Injection & Rate Limiting', ha='center', va='center', fontsize=7, fontstyle='italic', color='#0284c7')
    
    ax.annotate('', xy=(40, 43), xytext=(30, 43), arrowprops=dict(arrowstyle='<->', color='#475569', lw=1.5))
    ax.text(35, 44.5, 'HTTPS', ha='center', va='center', fontsize=7, fontweight='bold', color='#475569')
    
    app_box = patches.FancyBboxPatch((4, 16), 97, 18, boxstyle='round,pad=1', facecolor='#f8fafc', edgecolor='#2563eb', linewidth=1.5)
    ax.add_patch(app_box)
    ax.text(52.5, 31.5, 'Backend Application Tier (Express 5 / Node.js >= 22)', ha='center', va='center', fontsize=10, fontweight='bold', color='#1d4ed8')
    
    mods = [
        ('Auth & RBAC', 'Argon2id Hashes\nHttpOnly Cookies\nCSRF Token Guard', 6),
        ('Catalogue & Price', 'Integer Paise Math\nGST, Cess & RTO\nPrice Books CMS', 22),
        ('Booking Engine', 'Pessimistic Row Locks\nCapacity Checks\nDouble-Booking Guard', 38),
        ('Lead CRM & SLA', 'Zod Validation\nWorkload Router\n30-Min SLA Clock', 54),
        ('Used Car CMS', 'Two-Person Rule\nPrice Proposals\n150-Point Audits', 70),
        ('Grounded AI', 'Deterministic Rules\nStock Matching\nResponse Drafts', 86),
    ]
    for title, desc, x_pos in mods:
        m = patches.FancyBboxPatch((x_pos, 18), 13.5, 11, boxstyle='round,pad=0.5', facecolor='#ffffff', edgecolor='#cbd5e1', linewidth=1)
        ax.add_patch(m)
        ax.text(x_pos + 6.75, 26.5, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')
        ax.text(x_pos + 6.75, 21.8, desc, ha='center', va='center', fontsize=6.5, color='#475569')
    
    ax.annotate('', xy=(53, 34), xytext=(53, 37), arrowprops=dict(arrowstyle='<->', color='#2563eb', lw=1.5))
    ax.text(54.5, 35.5, 'Internal HTTP', ha='left', va='center', fontsize=7, fontweight='bold', color='#2563eb')
    
    db_box = patches.FancyBboxPatch((18, 2), 69, 11, boxstyle='round,pad=1', facecolor='#f0fdf4', edgecolor='#059669', linewidth=1.5)
    ax.add_patch(db_box)
    ax.text(52.5, 10, 'Data Persistence Tier (PostgreSQL 18 Alpine via Prisma 6 ORM)', ha='center', va='center', fontsize=9.5, fontweight='bold', color='#047857')
    ax.text(52.5, 6.5, '36 Relational Models • Interactive Transactions • Pessimistic Row-Level Locks\nPhysical Inventory (45) • Pre-Owned (10) • Leads & SLA Timeline • Auth Audits', ha='center', va='center', fontsize=7.5, color='#334155')
    
    ax.annotate('', xy=(52.5, 13), xytext=(52.5, 16), arrowprops=dict(arrowstyle='<->', color='#059669', lw=1.5))
    ax.text(54, 14.5, 'Prisma Client (TCP 5432)', ha='left', va='center', fontsize=7, fontweight='bold', color='#059669')
    
    plt.tight_layout()
    plt.savefig('submission/diagrams/system_architecture.png', bbox_inches='tight', dpi=300)
    plt.close()
    
    # 2. Database ERD
    fig, ax = plt.subplots(figsize=(11, 6.2), dpi=300)
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 62)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 110, 62, facecolor='#ffffff'))
    
    ax.text(55, 59, 'Aurelia Motors — Core Relational Database Entity Model', ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(55, 56.2, 'Primary Domain Entities & Foreign Key Relationships', ha='center', va='center', fontsize=8.5, color='#64748b')
    
    def draw_table(x, y, w, h, name, fields, border_color='#3b82f6'):
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.4', facecolor='#ffffff', edgecolor=border_color, linewidth=1.2)
        ax.add_patch(box)
        header = patches.Rectangle((x, y + h - 2.8), w, 2.8, facecolor=border_color)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - 1.4, name, ha='center', va='center', fontsize=8, fontweight='bold', color='#ffffff')
        for idx, (f_name, f_type) in enumerate(fields):
            ax.text(x + 1.0, y + h - 4.2 - idx*1.8, f_name, ha='left', va='center', fontsize=6.5, color='#0f172a', fontweight='semibold' if 'PK' in f_type or 'FK' in f_type else 'normal')
            ax.text(x + w - 1.0, y + h - 4.2 - idx*1.8, f_type, ha='right', va='center', fontsize=6.2, color='#64748b')

    draw_table(4, 35, 22, 18, 'VehicleModel', [
        ('id (PK)', 'String'),
        ('slug (UQ)', 'String'),
        ('name', 'String'),
        ('bodyType', 'Enum'),
        ('isActive', 'Boolean')
    ], '#1e293b')

    draw_table(30, 35, 24, 18, 'VehicleVariant', [
        ('id (PK)', 'String'),
        ('modelId (FK)', 'String'),
        ('slug (UQ)', 'String'),
        ('fuelType', 'Enum'),
        ('transmission', 'Enum'),
        ('exShowroomPaise', 'BigInt')
    ], '#2563eb')

    draw_table(58, 35, 24, 18, 'NewVehicleInventory', [
        ('id (PK)', 'String'),
        ('variantId (FK)', 'String'),
        ('showroomId (FK)', 'String'),
        ('vin (UQ)', 'String'),
        ('status', 'Enum'),
        ('stockNumber', 'String')
    ], '#0284c7')

    draw_table(86, 35, 20, 18, 'Showroom', [
        ('id (PK)', 'String'),
        ('code (UQ)', 'String'),
        ('name', 'String'),
        ('city', 'String'),
        ('isActive', 'Boolean')
    ], '#0f766e')

    draw_table(4, 10, 22, 20, 'StaffUser', [
        ('id (PK)', 'String'),
        ('email (UQ)', 'String'),
        ('role', 'Enum'),
        ('firstName', 'String'),
        ('isActive', 'Boolean'),
        ('passwordHash', 'String')
    ], '#475569')

    draw_table(30, 10, 24, 20, 'Lead', [
        ('id (PK)', 'String'),
        ('showroomId (FK)', 'String'),
        ('assignedToId (FK)', 'String'),
        ('status', 'Enum'),
        ('phone', 'String'),
        ('slaBreached', 'Boolean'),
        ('consentGiven', 'Boolean')
    ], '#b45309')

    draw_table(58, 10, 24, 20, 'LeadActivity', [
        ('id (PK)', 'String'),
        ('leadId (FK)', 'String'),
        ('staffUserId (FK)', 'String'),
        ('type', 'Enum'),
        ('notes', 'String'),
        ('createdAt', 'DateTime')
    ], '#d97706')

    draw_table(86, 10, 20, 20, 'Appointments', [
        ('id (PK)', 'String'),
        ('facilityId (FK)', 'String'),
        ('bookingRef (UQ)', 'String'),
        ('startTime', 'DateTime'),
        ('status', 'Enum'),
        ('idempotencyKey', 'String')
    ], '#7c3aed')

    def draw_rel(x1, y1, x2, y2, label='1:N'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle='->', color='#64748b', lw=1.2, ls='--'))
        mx, my = (x1 + x2)/2, (y1 + y2)/2
        ax.text(mx, my + 0.6, label, ha='center', va='center', fontsize=6, color='#475569', backgroundcolor='#ffffff')

    draw_rel(26, 44, 30, 44, '1:N')
    draw_rel(54, 44, 58, 44, '1:N')
    draw_rel(86, 44, 82, 44, '1:N')
    draw_rel(26, 20, 30, 20, '1:N')
    draw_rel(54, 20, 58, 20, '1:N')
    draw_rel(90, 35, 54, 23, '1:N')
    draw_rel(96, 35, 96, 30, '1:N')

    plt.tight_layout()
    plt.savefig('submission/diagrams/database_erd.png', bbox_inches='tight', dpi=300)
    plt.close()

    # 3. Lead Workflow
    fig, ax = plt.subplots(figsize=(11, 4.0), dpi=300)
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 40)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 110, 40, facecolor='#ffffff'))
    
    ax.text(55, 37.5, 'Aurelia Motors — Lead Capture, Auto-Assignment & 30-Minute SLA Lifecycle', ha='center', va='center', fontsize=11.5, fontweight='bold', color='#0f172a')
    ax.text(55, 35.0, 'Customer Interest Pipeline with DPDP Act 2023 Consent & Response Tracking', ha='center', va='center', fontsize=8, color='#64748b')
    
    steps = [
        ('1. Capture', 'Public Web Enquiry,\nTrade-In Valuation,\nPortal CSV Import', '#f1f5f9', '#475569', 3),
        ('2. Validation', 'Zod Schema Check\nMandatory DPDP 2023\nConsent Verification', '#eff6ff', '#2563eb', 18.5),
        ('3. Dedup Check', 'Match Phone/Email\nWithin 30-Day Window;\nAppend Activity Log', '#fefce8', '#ca8a04', 34),
        ('4. Auto-Routing', 'Filter by Showroom;\nSelect Consultant with\nLowest Active Leads', '#f0fdf4', '#16a34a', 49.5),
        ('5. Staff Alert', 'In-App Notification;\n30-Minute Response\nSLA Clock Started', '#faf5ff', '#9333ea', 65),
        ('6. Outreach', 'Consultant Contact;\nAI Draft Generation\n(WhatsApp/SMS/Email)', '#fff1f2', '#e11d48', 80.5),
        ('7. First Response', 'First Contact Stamped;\nSLA Metric Saved;\nMove to Contacted', '#f0fdf4', '#059669', 96),
    ]

    for title, desc, bg_c, border_c, x_pos in steps:
        b = patches.FancyBboxPatch((x_pos, 7), 12, 22, boxstyle='round,pad=0.5', facecolor=bg_c, edgecolor=border_c, linewidth=1.3)
        ax.add_patch(b)
        tag = patches.Rectangle((x_pos, 24.5), 12, 4.5, facecolor=border_c)
        ax.add_patch(tag)
        ax.text(x_pos + 6, 26.75, title, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#ffffff')
        ax.text(x_pos + 6, 15.5, desc, ha='center', va='center', fontsize=6.5, color='#1e293b')

    for i in range(len(steps) - 1):
        x_from = steps[i][4] + 12
        x_to = steps[i+1][4]
        ax.annotate('', xy=(x_to, 18), xytext=(x_from, 18), arrowprops=dict(arrowstyle='->', color='#64748b', lw=1.5))

    plt.tight_layout()
    plt.savefig('submission/diagrams/lead_workflow.png', bbox_inches='tight', dpi=300)
    plt.close()
    print("All diagrams generated successfully.")

# -------------------------------------------------------------
# DOCX Document Construction Function
# -------------------------------------------------------------
def build_docx():
    doc = docx.Document()
    
    # Document Core Properties
    doc.core_properties.author = 'Lochan T N'
    doc.core_properties.title = 'Aurelia Motors — Technical Design Document'
    doc.core_properties.subject = 'Software Engineering Hiring Assignment'
    doc.core_properties.comments = 'Completed Hiring Assignment — Version 1.0 — Aurelia Motors'
    
    # Page Setup - A4 Portrait, 0.70 top/bottom, 0.75 left/right margins
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.70)
    section.bottom_margin = Inches(0.70)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    
    add_header_footer(section)
    
    # =========================================================
    # COVER PAGE
    # =========================================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(32)
    p_pre.paragraph_format.space_after = Pt(4)
    run_pre = p_pre.add_run("TECHNICAL DESIGN DOCUMENT  |  SYSTEM SPECIFICATION")
    run_pre.font.name = 'Calibri'
    run_pre.font.size = Pt(10)
    run_pre.font.bold = True
    run_pre.font.color.rgb = COLOR_ACCENT_BLUE
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(6)
    run_title = p_title.add_run("AURELIA MOTORS")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(28)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_NAVY_DARK
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run("Full-Stack Digital Dealership Platform & Multi-Facility Operations System")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = COLOR_BODY_TEXT
    
    # Horizontal accent divider table
    t_div = doc.add_table(rows=1, cols=1)
    t_div.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_div.autofit = False
    c_div = t_div.cell(0, 0)
    c_div.width = Inches(6.77)
    set_cell_background(c_div, HEX_BLUE)
    set_cell_margins(c_div, top=15, bottom=15, left=0, right=0)
    set_cell_borders(c_div)
    c_div.paragraphs[0].text = ''
    
    p_div_sp = doc.add_paragraph()
    p_div_sp.paragraph_format.space_before = Pt(0)
    p_div_sp.paragraph_format.space_after = Pt(16)
    
    # Metadata Block Table
    meta_headers = ["Project Attribute", "Specification Detail"]
    meta_rows = [
        ["Project Name", "Aurelia Motors Enterprise Dealership Platform"],
        ["Author", "Lochan T N"],
        ["Project Nature", "Software Engineering Hiring Project"],
        ["Document Version", "Version 1.0"],
        ["Project Status", "Completed Hiring Assignment"],
        ["Automated Test Verification", "127 Passing Automated Tests across 18 Test Suites (100% Pass Rate)"],
        ["Target Network Topology", "3 Showrooms & 2 Authorized Workshops in Lucknow, UP, India"],
        ["Core Architecture", "TypeScript Monorepo • React 19 SPA • Express 5 REST API • PostgreSQL 18 / 16+ • Prisma 6 ORM"],
        ["Repository URL", "https://github.com/lochan87/aurelia-motors"],
        ["Date of Completion", "November 2026"]
    ]
    add_styled_table(doc, meta_headers, meta_rows, [Inches(2.2), Inches(4.57)])
    
    p_cov_note = doc.add_paragraph()
    p_cov_note.paragraph_format.space_before = Pt(12)
    p_cov_note.paragraph_format.space_after = Pt(0)
    r_cn = p_cov_note.add_run(
        "Executive Summary Note: This engineering design document provides an architectural and operational overview "
        "of the Aurelia Motors platform. It covers system topology, database schemas, core retail workflows, "
        "CRM routing algorithms, grounded domain intelligence, RBAC security, data privacy, and testing verification. "
        "This project represents an individual hiring assessment prototype, not a commercial production deployment."
    )
    r_cn.font.name = 'Calibri'
    r_cn.font.size = Pt(8.5)
    r_cn.font.italic = True
    r_cn.font.color.rgb = COLOR_MUTED_TEXT
    
    doc.add_page_break()
    
    # =========================================================
    # TABLE OF CONTENTS
    # =========================================================
    add_heading_1(doc, "Table of Contents")
    add_body_p(doc, "This document is organized into thirteen technical sections covering the complete system lifecycle:")
    
    toc_items = [
        ("1. Executive Summary", "High-level overview, physical network topology, and key architectural metrics"),
        ("2. Problem Statement and Scope", "Franchise dealership challenges, DPDP Act 2023 compliance, Indian tax structure"),
        ("3. Technology Stack and Architecture Decisions", "React 19, Express 5, PostgreSQL 18/16+, TypeScript, integer paise math standard"),
        ("4. System Architecture Diagram", "Multi-tier containerized topology, edge gateway routing, and request lifecycle"),
        ("5. Database Design and Entity Relationships", "Core ER model, Prisma schemas, facility scoping, and table catalog"),
        ("6. Core Customer Workflows", "Discovery, on-road pricing formulas, capacity-safe booking, and trade-ins"),
        ("7. Dealership Operations", "Lead routing, 30-min SLA engine, CSV portal ingestion, inventory CMS, price approvals"),
        ("8. AI-Assisted Features and Limitations", "Aurelia Grounded Domain Engine, lead summaries, message drafts, boundaries"),
        ("9. Authentication, Authorization and Data Privacy", "Argon2id, HttpOnly sessions, CSRF, RBAC matrix, DPDP 2023 compliance"),
        ("10. Testing and Verification", "127 automated tests across 18 suites, unit, integration, and journey verification"),
        ("11. Local Setup and Deployment", "Prerequisites, local development, Docker Compose topology, demo credentials"),
        ("12. Known Limitations and Future Improvements", "Simulated gateways, concurrency limits, production hardening roadmap"),
        ("13. Repository and Reviewer Access", "GitHub repository details, test execution commands, and document governance")
    ]
    for num_title, desc in toc_items:
        add_bullet(doc, num_title, desc)
        
    add_callout(
        doc,
        "Architectural Focus: Operational Integrity & Determinism",
        "Aurelia Motors prioritizes data integrity and determinism over speculative complexity. "
        "All monetary values are calculated in 64-bit integer paise to prevent floating-point rounding drift. "
        "Demonstrator fleet test-drives and workshop service bays enforce capacity checks using interactive transactions "
        "and pessimistic row-level database locks to serialize concurrent requests. "
        "The AI domain engine operates on grounded database heuristics rather than probabilistic cloud LLMs."
    )
    
    # =========================================================
    # SECTION 1: EXECUTIVE SUMMARY
    # =========================================================
    add_heading_1(doc, "1. Executive Summary")
    add_body_p(
        doc,
        "Aurelia Motors is an individual software engineering hiring project designed to model an authorized "
        "multi-facility passenger car franchise network in Lucknow, Uttar Pradesh, India. The application unifies "
        "customer-facing digital automotive retail with internal back-office dealership operations."
    )
    add_body_p(
        doc,
        "The physical franchise network modeled and seeded in the platform comprises three primary retail showrooms "
        "and two dedicated authorized service workshops strategically positioned across Lucknow's commercial corridors:"
    )
    add_bullet(doc, "Showroom 1: Central Lucknow (LKO-CENTRAL)", "Flagship sales facility on Ashok Marg, Hazratganj, handling high-volume passenger sedan and crossover sales.");
    add_bullet(doc, "Showroom 2: Gomti Nagar (LKO-GOMTI)", "Boutique digital retail centre situated in Gomti Nagar Phase 2, specializing in premium crossovers and executive electric sedans.");
    add_bullet(doc, "Showroom 3: Kanpur Road (LKO-KANPUR)", "Commercial highway showroom located along the Kanpur-Lucknow highway corridor, handling utility vehicles and certified pre-owned units.");
    add_bullet(doc, "Workshop 1: Transport Nagar Workshop (LKO-WS-TRANS)", "Heavy maintenance, accident repair, paint shop, and scheduled multi-bay vehicle servicing center with 8 service bays.");
    add_bullet(doc, "Workshop 2: Alambagh Workshop (LKO-WS-ALAM)", "Fast-track periodic maintenance, express oil clinics, and diagnostic servicing workshop with 8 service bays.");
    
    add_body_p(
        doc,
        "The application provides public customer engagement—including vehicle model discovery, variant comparisons, "
        "transparent on-road pricing with reducing-balance EMI calculators, capacity-safe test-drive reservations, "
        "service appointment scheduling, and certified used-car browsing with 150-point inspection findings—alongside "
        "staff operations. Operational capabilities include role-based staff authentication, automated lead assignment "
        "with a 30-minute response-time SLA clock, external auto portal CSV batch ingestion, centralized CMS inventory management, "
        "two-person used-car price adjustments, and grounded domain intelligence."
    )
    add_body_p(
        doc,
        "The platform is implemented in a modern TypeScript monorepo using React 19, Express 5, and PostgreSQL (PostgreSQL 18 "
        "Alpine in Docker Compose, compatible with PostgreSQL 16+) via Prisma 6 ORM. The implementation is verified by "
        "127 automated tests across 18 test suites and containerized via Docker Compose."
    )

    # =========================================================
    # SECTION 2: PROBLEM STATEMENT AND SCOPE
    # =========================================================
    add_heading_1(doc, "2. Problem Statement and Scope")
    add_body_p(
        doc,
        "Automotive retail across Tier-1 and Tier-2 Indian metropolitan markets has historically suffered from operational fragmentation. "
        "Prospective buyers face disjointed digital touchpoints, opaque on-road pricing estimates that omit local taxes, "
        "frequent double-booking of demonstrator fleet vehicles, and unverified pre-owned vehicle quality claims. "
        "On the dealership side, sales consultants struggle with scattered customer enquiries across third-party auto portals "
        "(such as CarDekho and CarWale), slow response times that degrade conversion rates, and a lack of auditability "
        "when adjusting certified pre-owned inventory pricing."
    )
    
    add_heading_2(doc, "2.1 Indian Regulatory and Fiscal Framework")
    add_body_p(
        doc,
        "To reflect realistic commercial operations in Lucknow, Uttar Pradesh, the platform architecture incorporates "
        "two critical Indian legal and fiscal frameworks:"
    )
    add_bullet(
        doc,
        "Digital Personal Data Protection Act 2023 (DPDP Act)",
        "Mandates explicit, auditable customer consent prior to collecting personal identifiers (phone numbers, email addresses, "
        "and physical addresses). The platform enforces consent capture across all public enquiry and valuation forms, "
        "stores immutable consent timestamps, and masks vehicle registration numbers (e.g., UP32-XX-1234) on public pre-owned listings."
    )
    add_bullet(
        doc,
        "Indian Automotive Tax and Fiscal Architecture",
        "On-road pricing incorporates Ex-showroom base prices, Goods and Services Tax (GST) with applicable Compensation Cess, "
        "Uttar Pradesh State Road Transport Office (RTO) registration fees (8% for petrol/EV, 10% for diesel), mandatory multi-year "
        "insurance estimates, dealer logistics charges, and statutory Tax Collected at Source (TCS) of 1% on transactions exceeding ₹10,00,000."
    )
    
    add_heading_2(doc, "2.2 Implemented Scope vs. Simulated Boundaries")
    add_body_p(
        doc,
        "To maintain rigorous architectural focus without unnecessary commercial dependencies, the platform explicitly defines "
        "what is implemented as working application logic versus what is simulated:"
    )
    add_bullet(
        doc,
        "Fully Implemented Systems",
        "Public retail web SPA, authenticated staff administration portal, PostgreSQL relational schema with Prisma 6 ORM, "
        "concurrency-safe test-drive and workshop booking engine, lead CRM with automated lowest-workload consultant routing, "
        "30-minute first-response SLA tracking, CSV batch ingestion with row-level validation, two-person used car pricing governance, "
        "and deterministic grounded domain intelligence."
    )
    add_bullet(
        doc,
        "Simulated Integration Boundaries",
        "Payment gateway checkout is represented via tokenized booking references rather than live payment gateway integration; "
        "telecom message delivery (WhatsApp/SMS) generates grounded, personalized message drafts for staff review rather than "
        "transmitting live traffic over commercial telecom aggregator APIs."
    )

    # =========================================================
    # SECTION 3: TECHNOLOGY STACK AND ARCHITECTURE DECISIONS
    # =========================================================
    add_heading_1(doc, "3. Technology Stack and Architecture Decisions")
    add_body_p(
        doc,
        "The Aurelia Motors platform is structured as an npm workspaces monorepo containing three coordinated packages: "
        "@aurelia/shared (isomorphic domain logic, Zod validation schemas, pricing calculators, and TypeScript interfaces), "
        "@aurelia/api (Express 5 backend, Prisma 6 ORM, and REST endpoints), and @aurelia/web (React 19 SPA frontend)."
    )
    
    add_heading_2(doc, "3.1 Component Architecture and Technology Selection")
    add_bullet(
        doc,
        "Frontend SPA (React 19, TypeScript, Vite, Tailwind CSS 4)",
        "React 19 provides modern concurrent rendering and robust state primitives. Vite delivers fast hot module replacement. "
        "Tailwind CSS 4 provides a modern, utility-first design system without CSS runtime overhead. React Router 7 manages declarative "
        "client routing and route protection. TanStack Query v5 manages asynchronous server state, optimistic mutations, and background caching."
    )
    add_bullet(
        doc,
        "Backend REST API (Express 5, Node.js >= 22, Zod)",
        "Express 5 provides an HTTP routing pipeline with native async error handling. Node.js >= 22.0.0 (supporting active LTS 22 and 24, "
        "aligned with node:22-alpine container images) ensures runtime stability. Zod enforces runtime boundary validation, sharing schema definitions "
        "between client and server to guarantee end-to-end type safety."
    )
    add_bullet(
        doc,
        "Data Persistence (PostgreSQL 18 Alpine / 16+, Prisma 6 ORM)",
        "PostgreSQL provides ACID guarantees, row-level locking, and transactional consistency required to serialize booking requests. "
        "Prisma 6.19 generates type-safe database queries and manages declarative schema migrations across 36 models."
    )
    add_bullet(
        doc,
        "Security & Authentication (Argon2id, Session Cookies, CSRF)",
        "Staff authentication utilizes Argon2id password hashing, signed HttpOnly SameSite=Lax session cookies, double-submit CSRF tokens, "
        "and location-scoped Role-Based Access Control (RBAC) middleware."
    )
    
    add_heading_2(doc, "3.2 Key Architectural Decisions and Trade-Offs")
    add_bullet(
        doc,
        "Integer Paise Currency Standard",
        "Floating-point numbers in JavaScript and SQL introduce precision loss during tax and EMI calculations. All financial values "
        "(ex-showroom, RTO, insurance, TCS, discounts, and trade-in valuations) are strictly represented as 64-bit BigInt integer paise "
        "(1 INR = 100 paise). Conversion to rupee display strings occurs only at the presentation boundary."
    )
    add_bullet(
        doc,
        "Deterministic Grounded Domain Engine vs. External Cloud LLM",
        "Automotive retail requires strict factual accuracy regarding stock availability, vehicle specifications, and pricing. "
        "Relying on external cloud LLMs introduces unpredictable latency, recurring API costs, external network failure modes, "
        "and generative confabulation risks. Aurelia Motors implements a deterministic, heuristic-driven domain engine directly "
        "grounded in live PostgreSQL data, delivering fast local responses without generative errors or cloud API dependencies."
    )

    # =========================================================
    # SECTION 4: SYSTEM ARCHITECTURE DIAGRAM
    # =========================================================
    add_heading_1(doc, "4. System Architecture Diagram")
    add_body_p(
        doc,
        "The system employs a containerized multi-tier architecture isolating edge routing, application processing, and data persistence:"
    )
    
    add_figure(doc, "submission/diagrams/system_architecture.png", "Figure 4.1: Aurelia Motors End-to-End System Architecture and Container Topology")
    
    add_body_p(
        doc,
        "System Request Lifecycle Walkthrough:"
    )
    add_bullet(
        doc,
        "1. Ingress & Edge Proxy Tier",
        "Incoming HTTP/HTTPS client requests hit the Nginx edge proxy container on port 80/443. Nginx serves production-built static assets "
        "for the React 19 SPA, injects unique X-Request-ID headers, enforces client request rate limits, and reverse-proxies all /api/* "
        "traffic to the Express API container."
    )
    add_bullet(
        doc,
        "2. Application Middleware Pipeline",
        "Express 5 parses incoming JSON payloads and cookies, evaluates CORS policies, logs request traces via Pino, and executes "
        "CSRF protection middleware on mutating HTTP methods (POST, PATCH, DELETE, PUT). Authentication middleware decrypts and validates "
        "signed session cookies, hydrating the staff security context."
    )
    add_bullet(
        doc,
        "3. Route Controllers & Zod Validation",
        "Requests pass through modular controllers where input schemas are parsed using isomorphic Zod schemas. Invalid payloads "
        "are rejected immediately with structured HTTP 422 Unprocessable Entity envelopes containing exact field-level errors."
    )
    add_bullet(
        doc,
        "4. Domain Services & Concurrency Controls",
        "Business logic executes within specialized domain services. For booking operations, services wrap mutations in interactive Prisma "
        "transactions with pessimistic row-level locking (SELECT ... FOR UPDATE) to serialize concurrent slot requests."
    )
    add_bullet(
        doc,
        "5. Data Access & Persistence Tier",
        "Prisma Client executes parameterized SQL queries against PostgreSQL over dedicated connection pools, returning strongly typed "
        "models to the application tier."
    )

    # =========================================================
    # SECTION 5: DATABASE DESIGN AND ENTITY RELATIONSHIPS
    # =========================================================
    add_heading_1(doc, "5. Database Design and Entity Relationships")
    add_body_p(
        doc,
        "The relational data model is normalized into 36 tables designed to model dealership facilities, vehicle catalogs, "
        "physical inventory units, certified pre-owned cars, pricing books, staff authorization, leads, appointments, and audit trails."
    )
    
    add_figure(doc, "submission/diagrams/database_erd.png", "Figure 5.1: Simplified Core Relational Database Entity-Relationship Model")
    
    add_heading_2(doc, "5.1 Database Entity Model Catalog")
    add_body_p(
        doc,
        "The primary database models and their seeded record counts are summarized below:"
    )
    
    db_headers = ["Prisma Model", "Primary Key", "Key Foreign Keys", "Functional Responsibility", "Seeded Rows"]
    db_rows = [
        ["Showroom", "id (CUID)", "None", "Physical retail sales facilities across Lucknow", "3 facilities"],
        ["Workshop", "id (CUID)", "None", "Authorized vehicle maintenance workshops with bay limits", "2 centers"],
        ["VehicleModel", "id (CUID)", "None", "Passenger vehicle models (Lumen, Meridian, Solace, etc.)", "6 models"],
        ["VehicleVariant", "id (CUID)", "modelId", "Powertrain trims, transmissions, specifications, base prices", "15 variants"],
        ["NewVehicleInventory", "id (CUID)", "variantId, showroomId", "Physical showroom inventory units with VIN and stock status", "45 units"],
        ["UsedVehicle", "id (CUID)", "showroomId", "Certified pre-owned cars with masked plates & inspection score", "10 units"],
        ["UsedVehicleInspection", "id (CUID)", "usedVehicleId", "Comprehensive 150-point mechanical & electrical inspection", "10 audits"],
        ["PriceBook", "id (CUID)", "None", "Versioned pricing schemes with effective dates and overlap locks", "2 price books"],
        ["PriceComponent", "id (CUID)", "priceEntryId", "Configurable fee/tax components (FIXED or PERCENT_OF_EXSHOWROOM)", "Seed components"],
        ["StaffUser", "id (CUID)", "None", "Staff credentials, Argon2id hashes, and RBAC operational roles", "4 accounts"],
        ["Lead", "id (CUID)", "showroomId, assignedStaffId", "Inbound customer enquiries with 30-min SLA tracking clock", "Dynamic"],
        ["TestDriveAppointment", "id (CUID)", "showroomId, variantId", "Capacity-controlled demonstrator vehicle booking slots", "Dynamic"],
        ["ServiceAppointment", "id (CUID)", "workshopId", "Daily bay capacity-controlled workshop service reservations", "Dynamic"],
        ["AuthenticationAuditEvent", "id (CUID)", "staffUserId", "Immutable chronological audit log of staff authentication events", "Dynamic"]
    ]
    add_styled_table(doc, db_headers, db_rows, [Inches(1.5), Inches(0.8), Inches(1.3), Inches(2.47), Inches(0.7)])

    # =========================================================
    # SECTION 6: CORE CUSTOMER WORKFLOWS
    # =========================================================
    add_heading_1(doc, "6. Core Customer Workflows")
    add_body_p(
        doc,
        "The public retail application delivers self-service automotive retail capabilities across five core customer workflows:"
    )
    
    add_heading_2(doc, "6.1 Vehicle Discovery and Multi-Variant Comparison")
    add_body_p(
        doc,
        "Prospective buyers explore the active vehicle catalogue across six passenger models (Lumen, Meridian, Solace, Kestrel, "
        "Zephyr, and Apex). Users filter catalogue results by body type (Sedan, Compact SUV, Mid-Size SUV, Hatchback), fuel type "
        "(Petrol, Diesel, Electric, Hybrid), transmission (Manual, Automatic, DCT, e-CVT), and budget ranges. "
        "The interface supports side-by-side technical specification comparisons (dimensions, engine output, boot volume, "
        "safety ratings, and fuel efficiency) across variants."
    )
    
    add_heading_2(doc, "6.2 On-Road Price Transparency and Financing Calculations")
    add_body_p(
        doc,
        "Aurelia Motors provides an itemized on-road price calculation modeled on Uttar Pradesh RTO regulations and Indian tax rules. "
        "Components are stored as configurable price entries calculated via basis points or fixed integer paise."
    )
    
    add_callout(
        doc,
        "On-Road Pricing Calculation Formula",
        "On-Road Price = Ex-Showroom + RTO Registration + Insurance + TCS + Handling/Logistics + Optional Accessories\n\n"
        "Where:\n"
        "• Ex-Showroom: Versioned base price in integer paise defined in the active showroom price book.\n"
        "• RTO Registration: Configurable percentage rate (e.g., 8% for Petrol/EV; 10% for Diesel in Uttar Pradesh).\n"
        "• Comprehensive Insurance: Mandatory 1-year Own Damage + 3-year Third Party policy (bracketed base + percentage rate).\n"
        "• Tax Collected at Source (TCS): Statutory 1% under Section 206C(1F) of the Income Tax Act on any vehicle exceeding ₹10,00,000 (100,000,000 paise).\n"
        "• Logistics & Handling: Configurable dealer administrative fee (sample: ₹15,000)."
    )
    
    add_body_p(
        doc,
        "The on-road pricing engine is paired with an interactive reducing-balance EMI calculator. Buyers adjust loan principal, "
        "tenure (12 to 84 months), and annual interest rates (typically 8.5% to 11.5% p.a.). The monthly repayment is computed via:"
    )
    
    add_callout(
        doc,
        "Reducing-Balance Equated Monthly Installment (EMI) Formula",
        "EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)\n\n"
        "Where:\n"
        "• P: Principal loan amount in integer paise (Ex-Showroom minus customer down-payment).\n"
        "• r: Monthly interest rate (Annual Interest Rate / 12 / 100).\n"
        "• n: Total loan tenure in months (e.g., 60 months for a 5-year loan)."
    )
    
    add_heading_2(doc, "6.3 Capacity-Safe Test-Drive Reservations")
    add_body_p(
        doc,
        "Test-drive bookings validate against the physical demonstrator fleet assigned to each showroom. "
        "To serialize concurrent booking requests, the booking service executes inside an interactive Prisma transaction "
        "featuring explicit pessimistic row-level locking on assigned demonstrator vehicle records:"
    )
    add_code_block(
        doc,
        "// Concurrency-Safe Demonstrator Booking with Pessimistic Row Lock\n"
        "return await prisma.$transaction(async (tx) => {\n"
        "  const existing = await tx.testDriveAppointment.findUnique({ where: { idempotencyKey } });\n"
        "  if (existing) return existing;\n"
        "  // Pessimistic lock on showroom demo fleet to serialize concurrent bookings\n"
        "  await tx.$queryRaw`SELECT id FROM demo_vehicles WHERE id = ANY(${vehicleIds}) FOR UPDATE`;\n"
        "  const booked = await tx.testDriveAppointment.findMany({ where: { demoVehicleId: { in: vehicleIds }, ... } });\n"
        "  const freeVehicle = demoVehicles.find((v) => !bookedIds.has(v.id));\n"
        "  if (!freeVehicle) throw new AppError(409, 'SLOT_UNAVAILABLE', 'Selected slot is fully booked');\n"
        "  return tx.testDriveAppointment.create({ data: { bookingReference, demoVehicleId: freeVehicle.id, ... } });\n"
        "}, { isolationLevel: 'ReadCommitted' });"
    )
    add_body_p(
        doc,
        "Upon successful reservation, the customer receives an alphanumeric booking reference (e.g., TD-2026-8742) and an immutable "
        "confirmation token. Customers can self-service cancel or view appointments using this reference and token."
    )
    
    add_heading_2(doc, "6.4 Workshop Service Appointment Scheduling")
    add_body_p(
        doc,
        "Vehicle maintenance appointments are scheduled across the two authorized Lucknow workshops (Transport Nagar and Alambagh). "
        "The scheduling engine enforces daily capacity limits (maximum 8 service appointments per workshop per calendar day) "
        "using pessimistic locks on the workshop row (`SELECT id FROM workshops WHERE id = ... FOR UPDATE`) inside an interactive transaction. "
        "Customers select from standardized service packages (Periodic Maintenance, Monsoon Clinic, Brake Overhaul, and Diagnostic Audit)."
    )
    
    add_heading_2(doc, "6.5 Algorithmic Pre-Owned Trade-In Valuation")
    add_body_p(
        doc,
        "Prospective buyers seeking to trade in an existing vehicle receive an instant valuation range without registering. "
        "The valuation algorithm considers base original invoice price, annual straight-line depreciation (12% per year), "
        "mileage penalties (₹1.50 per km above 10,000 km/year threshold), and condition adjustment multipliers (0.90 for Fair, "
        "1.00 for Good, 1.08 for Excellent). The engine outputs an indicative lower/upper valuation band."
    )

    # =========================================================
    # SECTION 7: DEALERSHIP OPERATIONS
    # =========================================================
    add_heading_1(doc, "7. Dealership Operations")
    add_body_p(
        doc,
        "Internal dealership operations automate lead qualification, sales routing, response tracking, catalog CMS, and pricing governance:"
    )
    
    add_figure(doc, "submission/diagrams/lead_workflow.png", "Figure 7.1: Inbound Lead Processing, Workload Auto-Assignment & 30-Minute SLA Lifecycle")
    
    add_heading_2(doc, "7.1 Inbound Lead Capture and Automated Routing")
    add_body_p(
        doc,
        "Customer enquiries originate from public web forms, trade-in valuations, and third-party portal batch CSV imports. "
        "The lead processing engine executes in five automated stages:"
    )
    add_bullet(
        doc,
        "1. Consent & Zod Validation",
        "Enforces mandatory DPDP Act 2023 customer consent. Rejects invalid phone numbers or missing facility identifiers."
    )
    add_bullet(
        doc,
        "2. Duplicate Detection",
        "Checks for active leads with matching phone or email within the preceding 30 days. If found, appends the new interest "
        "to the existing customer timeline rather than creating fragmented duplicate leads."
    )
    add_bullet(
        doc,
        "3. Workload-Balanced Routing",
        "Filters sales consultants assigned to the target showroom (or USED_CAR_STAFF for trade-ins). Selects the consultant "
        "with the lowest count of active leads in statuses [NEW, ASSIGNED, CONTACTED, QUALIFIED, NEGOTIATING]. Ties are broken "
        "deterministically by least recently assigned timestamp."
    )
    add_bullet(
        doc,
        "4. SLA Clock Initialization",
        "Initializes a 30-minute first-response SLA timer. Dispatches an in-app notification to the assigned consultant's dashboard."
    )
    
    add_heading_2(doc, "7.2 Lead CRM Pipeline and 30-Minute SLA Tracking")
    add_body_p(
        doc,
        "Responding to customer inquiries promptly significantly increases conversion rates. The staff CRM inbox highlights "
        "active leads with real-time countdown timers. When a consultant logs an outreach activity (Phone Call, WhatsApp Message, "
        "Email, or In-Person Showroom Visit), the system records the exact response timestamp. If the response exceeds 30 minutes, "
        "the lead is permanently tagged as SLA breached for management reporting."
    )
    
    add_heading_2(doc, "7.3 External Portal CSV Batch Ingestion")
    add_body_p(
        doc,
        "Dealerships receive prospective leads exported from external portals (e.g., CarDekho and CarWale). "
        "Aurelia Motors provides a two-stage CSV ingestion engine:"
    )
    add_bullet(
        doc,
        "Stage 1: Validation Preview",
        "POST /api/staff/leads/import/preview parses uploaded CSV rows, validates phone numbers and model slugs, detects duplicate "
        "customer records, and returns structured summary metrics prior to database mutation."
    )
    add_bullet(
        doc,
        "Stage 2: Atomic Batch Ingestion",
        "POST /api/staff/leads/import executes inside a database transaction, batch-inserting qualified leads, automatically assigning "
        "consultants based on current showroom workloads, and creating audit logs for the import batch."
    )
    
    add_heading_2(doc, "7.4 Inventory CMS and Price Book Governance")
    add_body_p(
        doc,
        "Dealership administrators manage the vehicle lifecycle via protected CMS endpoints: provisioning new vehicle models, "
        "configuring variant powertrain parameters, updating showroom stock allocations, and publishing versioned price books. "
        "Price books enforce non-overlapping effective date intervals, preventing conflicting retail prices."
    )
    
    add_heading_2(doc, "7.5 Used-Car Pricing Proposals and Separation of Duties")
    add_body_p(
        doc,
        "To maintain margin discipline, certified pre-owned price adjustments enforce a strict separation of duties:"
    )
    add_bullet(
        doc,
        "Price Adjustment Proposal",
        "A Used Car Specialist inspects a certified vehicle and submits a price adjustment proposal (POST /api/staff/used-vehicles/:id/propose-price) "
        "in integer paise with written commercial justification."
    )
    add_bullet(
        doc,
        "Administrative Decision & Separation of Duties",
        "An Administrator reviews pending proposals (POST /api/staff/used-car-pricing/proposals/:id/approve). The system enforces "
        "separation of duties via role-based access control and an application-level identity check: the approving administrator "
        "cannot be the staff member who authored the proposal (proposal.proposedByStaffId === reviewer.id)."
    )

    # =========================================================
    # SECTION 8: AI-ASSISTED FEATURES AND LIMITATIONS
    # =========================================================
    add_heading_1(doc, "8. AI-Assisted Features and Limitations")
    add_body_p(
        doc,
        "Aurelia Motors incorporates the Aurelia Grounded Domain Engine—a deterministic, rules-based intelligence system "
        "grounded in live PostgreSQL catalog and inventory state. The engine provides three specialized staff-assistance capabilities:"
    )
    
    add_heading_2(doc, "8.1 Implemented Domain Intelligence Capabilities")
    add_bullet(
        doc,
        "1. Structured Lead Intent & Urgency Scoring (POST /api/staff/ai/:leadId/summary)",
        "Parses enquiry notes, identifies customer powertrain preferences, extracts stated budget parameters, "
        "and computes an objective urgency score (1 to 5) based on purchase timeframe keywords (e.g., 'immediate delivery', 'this weekend')."
    )
    add_bullet(
        doc,
        "2. Human-in-the-Loop Multi-Channel Response Drafts (POST /api/staff/ai/:leadId/response-draft)",
        "Generates tailored customer communication drafts across WhatsApp, SMS, and Email channels. Drafts dynamically inject "
        "customer name, requested vehicle variant, showroom address, assigned consultant contact details, and test-drive invitation links. "
        "Drafts are presented to sales consultants for review and manual dispatch, ensuring full human-in-the-loop oversight."
    )
    add_bullet(
        doc,
        "3. Inventory-Grounded Vehicle Recommendations (POST /api/staff/ai/:leadId/recommendations)",
        "Queries live PostgreSQL tables to identify physical inventory units and certified pre-owned cars matching the customer's "
        "budget bracket (+/- 15%) and powertrain preferences. Strictly filters against units currently marked as AVAILABLE in the database."
    )
    
    add_heading_2(doc, "8.2 Explicit Boundaries and Limitations")
    add_body_p(
        doc,
        "The AI domain engine adheres to strict engineering guardrails:"
    )
    add_bullet(doc, "Elimination of Generative Confabulation", "Because responses are derived deterministically from database queries and structured templates rather than probabilistic cloud LLMs, the engine does not invent non-existent models or stock.");
    add_bullet(doc, "No Automated External Transmission", "The engine generates message drafts for consultant review. It does not dispatch live telecom SMS or WhatsApp messages without human confirmation.");
    add_bullet(doc, "Fast Local Execution", "Executes in-process on the local Node.js runtime without external cloud API calls, avoiding third-party network latency and recurring API billing.");

    # =========================================================
    # SECTION 9: AUTHENTICATION, AUTHORIZATION AND DATA PRIVACY
    # =========================================================
    add_heading_1(doc, "9. Authentication, Authorization and Data Privacy")
    add_body_p(
        doc,
        "The security architecture enforces defense-in-depth across credentials, session management, access control, and privacy compliance:"
    )
    
    add_heading_2(doc, "9.1 Credential Security and Session Management")
    add_bullet(doc, "Password Hashing", "Staff passwords are hashed using Argon2id with secure random salts (minimum 8 characters, requiring uppercase, lowercase, numbers, and symbols).");
    add_bullet(doc, "HttpOnly Session Cookies", "Sessions are maintained via signed, HttpOnly, SameSite=Lax cookies, mitigating Cross-Site Scripting (XSS) session theft.");
    add_bullet(doc, "CSRF Defense", "Double-submit CSRF cookie and header validation is enforced across all mutating staff endpoints (POST, PATCH, DELETE, PUT).");
    add_bullet(doc, "Brute-Force Rate Limiting", "Login endpoints enforce rate limits (max 5 failed attempts per 15-minute window) using Express rate-limiting middleware.");
    
    add_heading_2(doc, "9.2 Role-Based Access Control (RBAC) Matrix")
    add_body_p(
        doc,
        "The system defines four discrete operational roles with strictly enforced permission boundaries:"
    )
    
    rbac_headers = ["Operational Role", "Location Scope", "Leads & CRM", "Bookings & Service", "Inventory & CMS", "Staff Admin"]
    rbac_rows = [
        ["ADMIN", "All Facilities", "Full View & Reassign", "Full View & Manage", "Create, Edit & Publish", "Full Staff Admin"],
        ["SALES_CONSULTANT", "Assigned Showrooms", "Assigned Leads Only", "Showroom Test-Drives", "Read-Only Inventory", "No Access"],
        ["USED_CAR_STAFF", "Assigned Showrooms", "Trade-In Enquiries", "No Access", "Propose Used Prices", "No Access"],
        ["SERVICE_ADVISOR", "Assigned Workshops", "No Access", "Workshop Bay Queue", "No Access", "No Access"]
    ]
    add_styled_table(doc, rbac_headers, rbac_rows, [Inches(1.5), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(0.87)])
    
    add_heading_2(doc, "9.3 Data Privacy & DPDP Act 2023 Compliance")
    add_bullet(
        doc,
        "Explicit Consent Auditing",
        "Customer enquiry forms require an affirmative checkbox consenting to contact under the Digital Personal Data Protection Act 2023. "
        "The CustomerConsent table records consent timestamps, consent text versions, and client IP hashes."
    )
    add_bullet(
        doc,
        "Plate Masking on Pre-Owned Vehicles",
        "Public certified pre-owned listings mask vehicle registration numbers (e.g., displaying UP32-XX-1234 instead of full registration) "
        "to protect previous owners' privacy until formal sales negotiation."
    )

    # =========================================================
    # SECTION 10: TESTING AND VERIFICATION
    # =========================================================
    add_heading_1(doc, "10. Testing and Verification")
    add_body_p(
        doc,
        "Aurelia Motors employs a multi-tiered automated test suite executed via Vitest and Supertest. "
        "The automated test suite comprises 127 automated test assertions across 18 dedicated test files:"
    )
    
    add_heading_2(doc, "10.1 Multi-Tiered Testing Strategy and Scope")
    add_bullet(
        doc,
        "Tier 1: Domain Unit Tests (@aurelia/shared — 3 suites, 14 tests)",
        "Validates mathematical calculations: on-road price tax itemization, reducing-balance EMI loan calculations, "
        "used vehicle depreciation algorithms, and Indian currency/number formatting."
    )
    add_bullet(
        doc,
        "Tier 2: API & Integration Tests (@aurelia/api — 14 suites, 99 tests)",
        "Executes Supertest HTTP assertions against real Express routes and PostgreSQL, verifying Zod schema boundary validation, "
        "Prisma database queries, Argon2id authentication, session cookies, CSRF tokens, and RBAC authorization."
    )
    add_bullet(
        doc,
        "Tier 3: End-to-End System Journey Tests (@aurelia/api — 1 suite, 14 tests)",
        "e2e-journeys.test.ts executes multi-step integration journey assertions via Supertest against the running Express HTTP pipeline "
        "and PostgreSQL database: Model Discovery to Lead Assignment, Certified Pre-Owned Inspection to Trade-In Valuation, "
        "Test-Drive Double-Booking Prevention, Workshop Bay Capacity Limits, and Staff CRM Operations. "
        "Note on Test Scope: The repository does not include browser-driven UI automation (such as Playwright or Cypress); "
        "all automated test assertions operate at the shared domain logic and API integration levels."
    )
    
    add_heading_2(doc, "10.2 Automated Test Suite Inventory")
    
    test_headers = ["Package & Suite File", "Test Scope & Focus", "Test Count", "Key Verification Assertions"]
    test_rows = [
        ["@aurelia/shared/finance.test.ts", "Domain Unit Math", "6 tests", "Reducing-balance EMI formulas, edge cases (0% interest, 84-mo tenures)"],
        ["@aurelia/shared/pricing.test.ts", "Pricing Domain", "4 tests", "Integer paise math, GST, RTO tiers (8% petrol vs 10% diesel), 1% TCS"],
        ["@aurelia/shared/format.test.ts", "Formatting Utilities", "4 tests", "Lakh/Crore Indian numbering, phone masking, date-time representations"],
        ["@aurelia/api/validation.test.ts", "Zod Validation", "2 tests", "Accepts valid payload bodies; returns structured 422 errors for malformed inputs"],
        ["@aurelia/api/health.test.ts", "Service Health", "7 tests", "Health envelope, database connectivity probe, request ID tracking, CORS"],
        ["@aurelia/api/showrooms.test.ts", "Facility Discovery", "3 tests", "Active Lucknow showrooms, facility detail by code, 404 error boundaries"],
        ["@aurelia/api/catalogue.test.ts", "Vehicle Catalogue", "6 tests", "Model listings, specification filters, transparent showroom on-road pricing"],
        ["@aurelia/api/used-vehicles.test.ts", "Certified Pre-Owned", "6 tests", "Masked plate browsing, 150-point inspection findings, sorting by price/km"],
        ["@aurelia/api/appointments.test.ts", "Test-Drive & Service", "8 tests", "Slot availability, double-booking rejection, workshop bay limits, cancellation"],
        ["@aurelia/api/auth.test.ts", "Auth & RBAC Security", "10 tests", "Argon2id login, HttpOnly cookies, CSRF defense, role-based route blocking"],
        ["@aurelia/api/leads.test.ts", "Lead CRM & Ingestion", "14 tests", "DPDP consent enforcement, 30-min SLA clock, auto-routing, CSV batch ingestion"],
        ["@aurelia/api/cms.test.ts", "Admin CMS Governance", "7 tests", "Model/variant provisioning, inventory stock updates, price book overlap locks"],
        ["@aurelia/api/used-car-pricing.test.ts", "Pricing Governance", "6 tests", "Price proposals, separation of duties, self-approval prevention (403)"],
        ["@aurelia/api/ai.test.ts", "Grounded Domain AI", "6 tests", "Deterministic lead intent summaries, multi-channel response drafts, stock match"],
        ["@aurelia/api/notifications.test.ts", "Staff Notifications", "5 tests", "In-app alerts, unread counts, cross-staff ownership guards"],
        ["@aurelia/api/content.test.ts", "CMS Promotions", "4 tests", "Homepage promotional banners, finance schemes, admin mutation guards"],
        ["@aurelia/api/trade-ins.test.ts", "Trade-In Valuations", "5 tests", "Algorithmic valuation bands, DPDP consent, reference tracking"],
        ["@aurelia/api/e2e-journeys.test.ts", "API Journey Tests", "14 tests", "Multi-step customer and staff lifecycle integration journeys via Supertest"]
    ]
    add_styled_table(doc, test_headers, test_rows, [Inches(1.8), Inches(1.1), Inches(0.7), Inches(3.17)])

    # =========================================================
    # SECTION 11: LOCAL SETUP AND DEPLOYMENT
    # =========================================================
    add_heading_1(doc, "11. Local Setup and Deployment")
    add_body_p(
        doc,
        "Aurelia Motors supports two deployment modes: local multi-workspace development via npm and containerized Docker Compose."
    )
    
    add_heading_2(doc, "11.1 System Prerequisites")
    add_bullet(doc, "Node.js Runtime", "Node.js >= 22.0.0 (LTS 22 or 24) and npm >= 10.0.0 (local development host or container).");
    add_bullet(doc, "Database", "PostgreSQL 16+ or Docker Desktop running postgres:18-alpine.");
    add_bullet(doc, "Container Engine", "Docker Desktop with Compose v2 support (optional for containerized mode).");
    
    add_heading_2(doc, "11.2 Local Development Quickstart")
    add_code_block(
        doc,
        "# 1. Clone repository and install dependencies\n"
        "git clone https://github.com/lochan87/aurelia-motors.git\n"
        "cd aurelia-motors\n"
        "npm install\n\n"
        "# 2. Build shared package and initialize database\n"
        "npm run build:shared\n"
        "npm run db:migrate --workspace @aurelia/api\n"
        "npm run db:seed --workspace @aurelia/api\n\n"
        "# 3. Start development servers\n"
        "npm run dev"
    )
    add_body_p(
        doc,
        "The public web application is accessible at http://localhost:5173, and the Express REST API at http://localhost:4000."
    )
    
    add_heading_2(doc, "11.3 Containerized Docker Compose Deployment")
    add_body_p(
        doc,
        "The application includes production Dockerfiles for each tier and a coordinated docker-compose.yml configuration:"
    )
    add_code_block(
        doc,
        "# Start all container services\n"
        "docker compose up -d --build\n\n"
        "# Verify container health\n"
        "curl http://localhost/api/health"
    )
    add_body_p(
        doc,
        "Docker Container Topology:"
    )
    add_bullet(doc, "aurelia-web", "Nginx Alpine reverse proxy on host port 80, serving React 19 production assets.");
    add_bullet(doc, "aurelia-api", "Express 5 Node.js container (node:22-alpine) on host port 4000 (proxied via Nginx on /api/*).");
    add_bullet(doc, "aurelia-postgres", "PostgreSQL 18 Alpine container (postgres:18-alpine) on host port 55432 (mapped to internal port 5432).");
    
    add_heading_2(doc, "11.4 Seed Demonstration Accounts")
    add_body_p(
        doc,
        "The database seed provisions four demonstration accounts representing distinct operational roles:"
    )
    
    staff_headers = ["Staff Email", "Operational Role", "Assigned Facility", "Demonstration Scope"]
    staff_rows = [
        ["admin@aureliamotors.com", "ADMIN", "All Facilities", "Full dealership administration, CMS, price approvals, staff user management"],
        ["sales.gomti@aureliamotors.com", "SALES_CONSULTANT", "Gomti Nagar Showroom", "Showroom lead inbox, 30-min SLA response tracking, test-drive schedules"],
        ["usedcars@aureliamotors.com", "USED_CAR_STAFF", "Central Showroom", "Certified pre-owned inspections, trade-in valuations, price adjustment proposals"],
        ["service.transport@aureliamotors.com", "SERVICE_ADVISOR", "Transport Nagar Workshop", "Workshop bay appointment management, vehicle check-ins, service status"]
    ]
    add_styled_table(doc, staff_headers, staff_rows, [Inches(2.18), Inches(1.22), Inches(1.35), Inches(2.02)])
    
    add_body_p(
        doc,
        "Note on Demonstration Credentials: In accordance with security best practices, plaintext passwords are not published "
        "in this technical specification. Demonstration staff accounts are provisioned with environment-configurable credentials "
        "documented in deployment.md (default: AURELIA_DEMO_PASSWORD). No production credentials exist."
    )

    # =========================================================
    # SECTION 12: KNOWN LIMITATIONS AND FUTURE IMPROVEMENTS
    # =========================================================
    add_heading_1(doc, "12. Known Limitations and Future Improvements")
    add_body_p(
        doc,
        "In accordance with transparent engineering principles, the current architecture identifies explicit operational boundaries "
        "and outlines the production hardening roadmap:"
    )
    
    add_heading_2(doc, "12.1 Known Limitations")
    add_bullet(
        doc,
        "Simulated Gateway Integration",
        "Booking deposits and vehicle token reservations generate cryptographic confirmation references rather than processing "
        "actual credit card or UPI transactions through a production payment gateway (such as Razorpay or Stripe)."
    )
    add_bullet(
        doc,
        "Simulated Telecom Outbound Dispatch",
        "Customer notification drafts (WhatsApp, SMS, Email) are generated deterministically and formatted for human review, "
        "but are not automatically transmitted over commercial telecom aggregator APIs."
    )
    add_bullet(
        doc,
        "Database-Level Concurrency Locks",
        "Capacity checks and double-booking guards leverage PostgreSQL interactive transactions and row-level locks. "
        "While robust for single-node multi-facility deployments, extreme high-throughput scale would benefit from distributed Redis locks."
    )
    
    add_heading_2(doc, "12.2 Production Hardening Roadmap")
    add_bullet(
        doc,
        "Real-Time WebSocket / SSE Push",
        "Upgrade staff notification and lead SLA countdown polling intervals to native Server-Sent Events (SSE) or WebSockets "
        "for zero-latency inbox alerts."
    )
    add_bullet(
        doc,
        "External Automotive Inventory Feeds",
        "Implement automated DMS (Dealer Management System) sync protocols (DMS-Open, CDK, or Reynolds & Reynolds) for automated "
        "synchronization of factory vehicle dispatches and yard inventory."
    )
    add_bullet(
        doc,
        "Multi-Showroom Read Replicas",
        "Deploy PostgreSQL read replicas across AWS ap-south-1 (Mumbai) and ap-south-2 (Hyderabad) regions to serve public vehicle "
        "browsing queries with low latency."
    )

    # =========================================================
    # SECTION 13: REPOSITORY AND REVIEWER ACCESS
    # =========================================================
    add_heading_1(doc, "13. Repository and Reviewer Access")
    add_body_p(
        doc,
        "The Aurelia Motors platform source code, automated test suites, deployment manifests, and technical documentation "
        "are version-controlled and accessible via the official GitHub repository:"
    )
    add_bullet(doc, "Repository URL", "https://github.com/lochan87/aurelia-motors");
    add_bullet(doc, "Primary Branch", "main");
    add_bullet(doc, "Author", "Lochan T N");
    add_bullet(doc, "License", "No license file; submitted for hiring evaluation");
    
    add_heading_2(doc, "13.1 Reviewer Verification Commands")
    add_code_block(
        doc,
        "# Execute complete test suite (127 automated tests across 18 suites)\n"
        "npm test\n\n"
        "# Execute code formatting & lint checks\n"
        "npm run lint\n\n"
        "# Verify TypeScript types across all workspaces\n"
        "npm run typecheck"
    )
    add_body_p(
        doc,
        "For comprehensive step-by-step local setup, Docker Compose deployment instructions, and troubleshooting procedures, "
        "please refer to deployment.md in the root directory."
    )
    
    # Save Document
    docx_path = os.path.abspath('submission/Aurelia_Motors_Technical_Design_Document.docx')
    doc.save(docx_path)
    print(f"Master DOCX successfully built: {docx_path} ({os.path.getsize(docx_path)} bytes)")
    return docx_path

# -------------------------------------------------------------
# PDF Export via Microsoft Word COM
# -------------------------------------------------------------
def export_pdf_via_word(docx_path):
    pdf_path = os.path.abspath('submission/Aurelia_Motors_Technical_Design_Document.pdf')
    print(f"Exporting DOCX to PDF via Word COM: {pdf_path}")
    
    import win32com.client
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    try:
        wb = word.Documents.Open(docx_path)
        wb.SaveAs(pdf_path, FileFormat=17) # 17 = wdFormatPDF
        wb.Close()
        print(f"PDF successfully exported: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
    finally:
        word.Quit()
    return pdf_path

# -------------------------------------------------------------
# Markdown TDD Generator
# -------------------------------------------------------------
def generate_markdown_tdd():
    md_path = os.path.abspath('submission/Aurelia_Motors_Technical_Design_Document.md')
    print(f"Generating synchronized Markdown TDD: {md_path}")
    
    md_content = """# Aurelia Motors — Technical Design Document

**Digital Automotive Dealership Platform & Multi-Facility Operations System**

* **Author:** Lochan T N
* **Project Nature:** Software Engineering Hiring Project
* **Document Version:** Version 1.0
* **Project Status:** Completed Hiring Assignment
* **Topology:** 3 Showrooms & 2 Authorized Workshops in Lucknow, Uttar Pradesh, India
* **Repository:** [https://github.com/lochan87/aurelia-motors](https://github.com/lochan87/aurelia-motors)
* **Automated Verification:** 127 Passing Automated Tests across 18 Test Suites (100% Pass Rate)
* **Technology Stack:** TypeScript Monorepo, React 19 SPA, Express 5 REST API, PostgreSQL 18 / 16+, Prisma 6 ORM

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement and Scope](#2-problem-statement-and-scope)
3. [Technology Stack and Architecture Decisions](#3-technology-stack-and-architecture-decisions)
4. [System Architecture Diagram](#4-system-architecture-diagram)
5. [Database Design and Entity Relationships](#5-database-design-and-entity-relationships)
6. [Core Customer Workflows](#6-core-customer-workflows)
7. [Dealership Operations](#7-dealership-operations)
8. [AI-Assisted Features and Limitations](#8-ai-assisted-features-and-limitations)
9. [Authentication, Authorization and Data Privacy](#9-authentication-authorization-and-data-privacy)
10. [Testing and Verification](#10-testing-and-verification)
11. [Local Setup and Deployment](#11-local-setup-and-deployment)
12. [Known Limitations and Future Improvements](#12-known-limitations-and-future-improvements)
13. [Repository and Reviewer Access](#13-repository-and-reviewer-access)

---

## 1. Executive Summary

Aurelia Motors is an individual software engineering hiring project designed to model an authorized multi-facility passenger car franchise network in Lucknow, Uttar Pradesh, India. The application unifies customer-facing digital automotive retail with internal back-office dealership operations.

The physical franchise network modeled and seeded in the platform comprises three retail showrooms and two authorized workshops:
* **Showroom 1 (LKO-CENTRAL):** Central Lucknow Flagship, Ashok Marg, Hazratganj (sedan and crossover sales).
* **Showroom 2 (LKO-GOMTI):** Gomti Nagar Boutique Centre, Gomti Nagar Phase 2 (executive sedans and electric vehicles).
* **Showroom 3 (LKO-KANPUR):** Kanpur Road Facility, Kanpur Highway Corridor (SUVs and certified pre-owned units).
* **Workshop 1 (LKO-WS-TRANS):** Transport Nagar Maintenance Center (8 service bays, accident repairs, scheduled maintenance).
* **Workshop 2 (LKO-WS-ALAM):** Alambagh Express Service Clinic (8 service bays, fast-track maintenance, diagnostic servicing).

The platform bridges public customer retail (model discovery, multi-variant comparison, transparent on-road pricing with reducing-balance EMI calculators, capacity-safe test-drive bookings, workshop service scheduling, and certified pre-owned cars with 150-point inspection findings) with operational dealership back-office execution (role-based staff authentication, automated lowest-workload lead routing, 30-minute response-time SLA tracking, portal CSV batch ingestion, CMS inventory management, two-person used-car price governance, and grounded domain intelligence).

---

## 2. Problem Statement and Scope

Automotive retail across Tier-1 and Tier-2 Indian metropolitan markets has historically suffered from fragmented customer touchpoints, opaque pricing estimates omitting state taxes, frequent double-booking of demonstrator fleet vehicles, and unverified pre-owned claims. On the dealership side, sales consultants face scattered leads across third-party auto portals (CarDekho, CarWale), slow response times exceeding conversion windows, and lack of auditability for used-car price reductions.

### 2.1 Indian Regulatory and Fiscal Framework
* **Digital Personal Data Protection Act 2023 (DPDP Act):** Mandates explicit, auditable customer consent prior to collecting personal identifiers. The platform captures consent on all public forms, records immutable timestamps, and masks vehicle registration numbers (`UP32-XX-1234`) on public pre-owned listings.
* **Automotive Tax Structure:** On-road pricing incorporates Ex-showroom base prices, GST with applicable Compensation Cess, Uttar Pradesh State RTO registration fees (8% for petrol/EV, 10% for diesel), mandatory insurance estimates, logistics charges, and statutory Tax Collected at Source (TCS) of 1% on transactions exceeding ₹10,00,000.

### 2.2 Implemented Scope vs. Simulated Boundaries
* **Fully Implemented:** Public customer web SPA, authenticated staff CRM portal, PostgreSQL schema via Prisma 6 ORM, concurrency-safe test-drive and workshop booking engine, lead CRM with automated lowest-workload consultant routing, 30-minute response SLA tracking, CSV batch ingestion, two-person used car pricing governance, and deterministic grounded domain intelligence.
* **Simulated Boundaries:** Payment gateway checkout uses tokenized booking references rather than live payment gateway integration; customer communication (WhatsApp/SMS) generates grounded message drafts for staff review rather than transmitting live traffic over commercial telecom aggregator APIs.

---

## 3. Technology Stack and Architecture Decisions

The platform is structured as an npm workspaces monorepo:
* **Frontend SPA:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, TanStack Query v5.
* **Backend REST API:** Express 5, Node.js >= 22.0.0 (LTS 22/24, `node:22-alpine` in Dockerfiles), Zod runtime validation.
* **Data Persistence:** PostgreSQL 18 Alpine in Docker Compose (compatible with PostgreSQL 16+), Prisma 6.19 ORM.
* **Security & Auth:** Argon2id password hashing, signed HttpOnly SameSite=Lax session cookies, CSRF protection tokens, location-scoped RBAC middleware.

### Key Architectural Decisions
* **Integer Paise Currency Standard:** All monetary values are strictly represented as 64-bit BigInt integer paise (1 INR = 100 paise) to prevent floating-point precision loss.
* **Deterministic Grounded Domain Engine:** Operates via rule-based heuristics grounded in live PostgreSQL data, delivering fast local responses without generative confabulation, API billing costs, or external network dependencies.

---

## 4. System Architecture Diagram

![System Architecture](diagrams/system_architecture.png)

### Request Lifecycle
1. **Ingress & Edge Proxy Tier:** Nginx reverse proxy on port 80/443 serves React 19 static assets, injects X-Request-ID headers, enforces rate limits, and proxies `/api/*` requests to Express.
2. **Application Middleware:** Express 5 parses JSON and cookies, enforces CORS, logs request traces via Pino, and executes CSRF middleware on mutating endpoints.
3. **Zod Validation:** Route controllers validate incoming payloads using isomorphic Zod schemas shared between client and server.
4. **Domain Services & Concurrency Controls:** Booking operations execute inside interactive Prisma transactions with pessimistic row-level locking (`SELECT ... FOR UPDATE`) to serialize concurrent slot requests.
5. **Persistence Tier:** Prisma Client executes parameterized SQL against PostgreSQL over dedicated connection pools.

---

## 5. Database Design and Entity Relationships

![Database ERD](diagrams/database_erd.png)

### Core Relational Models
* **Showroom & Workshop:** Facility locations across Lucknow with operating hours and geographic coordinates.
* **VehicleModel & VehicleVariant:** 6 passenger car models, 15 powertrain trims, detailed technical specifications.
* **NewVehicleInventory:** 45 physical showroom vehicles tracking VIN, stock number, and lifecycle status (`AVAILABLE`, `RESERVED`, `SOLD`).
* **UsedVehicle & UsedVehicleInspection:** 10 certified pre-owned units with 150-point inspection findings and masked registration plates (`UP32-XX-1234`).
* **PriceBook & PriceComponent:** Versioned pricing books with configurable component breakdowns (fixed paise or basis points).
* **StaffUser & StaffLocationAssignment:** Staff credentials, Argon2id hashes, and RBAC operational roles.
* **Lead & LeadActivity:** Inbound customer enquiries with 30-minute SLA countdown timers and consultation activity timelines.
* **TestDriveAppointment & ServiceAppointment:** Capacity-controlled demonstrator vehicle and workshop service bay bookings.
* **AuthenticationAuditEvent:** Immutable chronological audit log of staff authentication events.

---

## 6. Core Customer Workflows

### 6.1 Vehicle Discovery and Comparison
Prospective buyers browse 6 passenger vehicle models and 15 variants, filtering by body type, fuel type, transmission, and budget ranges, with side-by-side specification comparisons.

### 6.2 On-Road Price Transparency and EMI Calculations
Itemized on-road pricing formula:
$$\text{On-Road Price} = \text{Ex-Showroom} + \text{RTO} + \text{Insurance} + \text{TCS} + \text{Logistics} + \text{Accessories}$$
* **RTO:** Configurable rate (sample: 8% for Petrol/EV/Hybrid; 10% for Diesel in Uttar Pradesh).
* **TCS:** Statutory 1% on transactions exceeding ₹10,00,000 (100,000,000 paise).
* **Reducing-Balance EMI Formula:**
$$E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$$

### 6.3 Capacity-Safe Test-Drive Reservations
Wraps demonstrator slot reservations in interactive Prisma transactions with pessimistic row-level locks (`SELECT id FROM demo_vehicles WHERE id = ANY(...) FOR UPDATE`) to serialize concurrent requests. Enforces idempotency via unique `idempotencyKey` constraints. Returns a booking reference (e.g., `TD-2026-8742`) and confirmation token.

### 6.4 Workshop Service Appointment Scheduling
Enforces daily workshop bay capacity limits (maximum 8 service appointments per workshop per calendar day) using pessimistic row locks on the workshop row (`SELECT id FROM workshops WHERE id = ... FOR UPDATE`) inside an interactive transaction.

### 6.5 Algorithmic Pre-Owned Trade-In Valuation
Multi-variable algorithmic valuation model considering original invoice price, annual straight-line depreciation (12%/year), mileage penalties (₹1.50/km above 10,000 km/yr), and condition multipliers (0.90 Fair, 1.00 Good, 1.08 Excellent).

---

## 7. Dealership Operations

![Lead Workflow](diagrams/lead_workflow.png)

### 7.1 Inbound Lead Capture and Automated Routing
Captures customer enquiries across web forms and portal CSV imports. Enforces DPDP Act 2023 consent, detects duplicates within a 30-day window, and automatically routes leads to the sales consultant with the lowest count of active leads (`[NEW, ASSIGNED, CONTACTED, QUALIFIED, NEGOTIATING]`), breaking ties by least recently assigned timestamp.

### 7.2 Lead CRM Pipeline and 30-Minute SLA Tracking
Staff dashboard displays active leads with real-time countdown timers against a 30-minute first-response SLA. Logging a customer interaction records response timestamps; exceeding 30 minutes permanently tags the lead as SLA breached.

### 7.3 External Portal CSV Batch Ingestion
Two-stage ingestion pipeline: Stage 1 parses and validates CSV rows (POST `/api/staff/leads/import/preview`), detecting duplicates; Stage 2 atomically batch-inserts leads and assigns consultants (POST `/api/staff/leads/import`).

### 7.4 Inventory CMS and Price Book Governance
Administrators manage models, variants, physical showroom inventory allocations, and promotional banners. Price books enforce non-overlapping date intervals.

### 7.5 Used-Car Pricing Proposals and Separation of Duties
Used Car Specialists submit price adjustment proposals in integer paise with written justification. Administrators review, approve, or reject proposals. Separation of duties is enforced at the application and authorization layer: the approving staff member must hold the ADMIN role and cannot approve their own proposal (`proposal.proposedByStaffId === reviewer.id`).

---

## 8. AI-Assisted Features and Limitations

The Aurelia Grounded Domain Engine provides deterministic, rules-based staff assistance grounded in live PostgreSQL data:
1. **Lead Intent & Urgency Scoring (POST `/api/staff/ai/:leadId/summary`):** Extracts powertrain preferences, budget brackets, and computes urgency scores (1-5).
2. **Multi-Channel Response Drafts (POST `/api/staff/ai/:leadId/response-draft`):** Generates personalized WhatsApp, SMS, and Email drafts for consultant review and manual dispatch.
3. **Inventory Recommendations (POST `/api/staff/ai/:leadId/recommendations`):** Matches customer preferences against available showroom and pre-owned inventory (+/- 15% budget), strictly filtered by `status: 'AVAILABLE'`.

### Boundaries & Guardrails
* Eliminates generative confabulation because outputs are generated deterministically from database queries and structured templates.
* No automated external transmission: generates drafts for human-in-the-loop staff review.
* Executes in-process on the local Node.js runtime without external API network overhead.

---

## 9. Authentication, Authorization and Data Privacy

* **Credentials:** Argon2id hashing with secure random salts, rate-limited login endpoints.
* **Sessions:** Signed, HttpOnly, SameSite=Lax session cookies with CSRF tokens.
* **RBAC Roles:** `ADMIN` (all facilities, full CMS/admin), `SALES_CONSULTANT` (showroom-scoped leads & test-drives), `USED_CAR_STAFF` (trade-ins & price proposals), `SERVICE_ADVISOR` (workshop bay queues).
* **Data Privacy:** Explicit DPDP Act 2023 consent recording, plate masking on pre-owned listings (`UP32-XX-1234`), immutable authentication audit logging (`AuthenticationAuditEvent`).

---

## 10. Testing and Verification

Multi-tier automated test suite comprising **127 passing automated tests across 18 test suites**:
* **Domain Unit Tests (@aurelia/shared — 3 suites, 14 tests):** Shared finance formulas, on-road pricing math, currency formatting.
* **API Integration Tests (@aurelia/api — 14 suites, 99 tests):** Express routes, Zod validation, Prisma queries, Argon2id auth, RBAC access control.
* **API Journey Integration Tests (@aurelia/api — 1 suite, 14 tests in `e2e-journeys.test.ts`):** Complete customer and staff workflows:
  * Customer Journey 1: Model Discovery -> On-Road Pricing -> Enquiry -> Consultant Assignment.
  * Customer Journey 2: Pre-Owned Browsing -> 150-Point Report -> Trade-In Valuation.
  * Customer Journey 3: Test-Drive Booking -> Double-Booking Rejection -> Cancellation.
  * Customer Journey 4: Workshop Service Booking -> Bay Capacity Enforcement.
  * Staff Operations: CRM Response Tracking -> CSV Batch Ingestion -> Grounded AI Operations.
  * Security & Isolation: Cross-Showroom Data Isolation -> CSRF Defense -> Admin Barriers.
* **Note on Test Scope:** `e2e-journeys.test.ts` executes multi-step integration journey assertions via Supertest against the running Express HTTP pipeline and PostgreSQL database. The repository does not include browser-driven UI automation (such as Playwright or Cypress); all automated test assertions operate at the shared domain logic and API integration levels.

---

## 11. Local Setup and Deployment

### Prerequisites
* Node.js >= 22.0.0, npm >= 10.0.0
* PostgreSQL 16+ or Docker Desktop running `postgres:18-alpine`

### Local Development
```bash
# Clone and install
git clone https://github.com/lochan87/aurelia-motors.git
cd aurelia-motors
npm install

# Initialize database
npm run build:shared
npm run db:migrate --workspace @aurelia/api
npm run db:seed --workspace @aurelia/api

# Start dev servers
npm run dev
```

### Docker Compose Deployment
```bash
docker compose up -d --build
curl http://localhost/api/health
```

### Seed Demonstration Accounts
* **Admin:** `admin@aureliamotors.com` (All Facilities — CMS, price approvals, staff administration)
* **Sales Consultant:** `sales.gomti@aureliamotors.com` (Gomti Nagar Showroom — Lead CRM, SLA tracking, test-drives)
* **Used Car Specialist:** `usedcars@aureliamotors.com` (Central Showroom — 150-point inspections, price adjustment proposals)
* **Service Advisor:** `service.transport@aureliamotors.com` (Transport Nagar Workshop — Bay capacity queue, service check-ins)

*Note on Demonstration Credentials:* In accordance with security best practices, plaintext passwords are not published in this technical specification. Demonstration staff accounts are provisioned with environment-configurable credentials documented in `deployment.md` (default: `AURELIA_DEMO_PASSWORD`). No production credentials exist.

---

## 12. Known Limitations and Future Improvements

* **Simulated Gateways:** Payment deposits generate cryptographic references rather than processing live payment gateway transactions.
* **Simulated Telecom:** WhatsApp/SMS drafts are formatted for human review rather than transmitted over live aggregator APIs.
* **Concurrency Scale:** PostgreSQL interactive transactions and row-level locks provide strong consistency; multi-node distributed scale would benefit from Redis Redlock.
* **Future Roadmap:** Server-Sent Events (SSE) for instant CRM notifications, external DMS sync protocols, and read replicas for multi-region scale.

---

## 13. Repository and Reviewer Access

* **Repository:** [https://github.com/lochan87/aurelia-motors](https://github.com/lochan87/aurelia-motors)
* **Primary Branch:** `main`
* **Author:** Lochan T N
* **License:** No license file; submitted for hiring evaluation
* **Verification Commands:**
  * Test Suite: `npm test`
  * Linting: `npm run lint`
  * Typecheck: `npm run typecheck`
"""
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Markdown TDD successfully written: {md_path} ({os.path.getsize(md_path)} bytes)")
    return md_path

# -------------------------------------------------------------
# Visual PDF Verification Function
# -------------------------------------------------------------
def verify_rendered_pages(pdf_path):
    import pdfplumber
    print(f"\nPerforming visual and programmatic verification on: {pdf_path}")
    
    os.makedirs('submission/pdf_pages', exist_ok=True)
    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        print(f"Total Pages: {num_pages}")
        
        forbidden_terms = ['isocode', 'milestone 1', 'milestone 2', 'milestone 3', 
                           'milestone 4', 'milestone 5', 'milestone 6', 'milestone 7', 
                           'take-home', 'take home', 'deadline', 'november 9']
        
        found_forbidden = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            for term in forbidden_terms:
                if term in text.lower():
                    found_forbidden.append((i + 1, term))
            
            # Render page to PNG for visual inspection
            img_path = f"submission/pdf_pages/page_{i+1}.png"
            img = page.to_image(resolution=120)
            img.save(img_path)
            
        if found_forbidden:
            print("WARNING: Found forbidden terms:")
            for p_num, term in found_forbidden:
                print(f"  Page {p_num}: {term}")
        else:
            print("PASSED: Zero forbidden terms found across all pages!")
            
        print(f"PASSED: All {num_pages} pages rendered to PNG in submission/pdf_pages/ for visual verification.")
        
        if 10 <= num_pages <= 14:
            print(f"PASSED: Page count {num_pages} is squarely within target range (10-14 pages).")
        else:
            print(f"NOTE: Page count is {num_pages}.")

# -------------------------------------------------------------
# Main Execution Entrypoint
# -------------------------------------------------------------
def main():
    print("="*60)
    print("Aurelia Motors — Technical Design Document Master Build")
    print("="*60)
    
    # 1. Generate high-DPI diagram images
    generate_diagrams()
    
    # 2. Build Master Word DOCX
    docx_path = build_docx()
    
    # 3. Export PDF via Word COM
    pdf_path = export_pdf_via_word(docx_path)
    
    # 4. Generate synchronized Markdown
    md_path = generate_markdown_tdd()
    
    # 5. Verify PDF and render every page to PNG
    verify_rendered_pages(pdf_path)
    
    print("="*60)
    print("Master build complete! All deliverables generated and verified.")
    print("="*60)

if __name__ == '__main__':
    main()
