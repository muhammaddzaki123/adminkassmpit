import os
import xml.etree.ElementTree as ET
import math

def escape_xml(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&apos;").replace('"', "&quot;")

class DrawioDiagram:
    def __init__(self):
        self.mxfile = ET.Element('mxfile')
        diagram = ET.SubElement(self.mxfile, 'diagram', id='eer_diagram', name='Page-1')
        self.model = ET.SubElement(diagram, 'mxGraphModel', dx='1000', dy='1000', grid='1', gridSize='10', guides='1', tooltips='1', connect='1', arrows='1', fold='1', page='1', pageScale='1', pageWidth='8000', pageHeight='8000', math='0', shadow='0')
        self.root = ET.SubElement(self.model, 'root')
        ET.SubElement(self.root, 'mxCell', id='0')
        ET.SubElement(self.root, 'mxCell', id='1', parent='0')
        self.next_id = 2

    def get_id(self):
        cur = self.next_id
        self.next_id += 1
        return str(cur)

    def add_entity(self, name, x, y, width=120, height=60):
        cell_id = self.get_id()
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(name), style='rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;', vertex='1', parent='1')
        ET.SubElement(cell, 'mxGeometry', x=str(x), y=str(y), width=str(width), height=str(height), **{'as': 'geometry'})
        return cell_id

    def add_attribute(self, name, x, y, is_key=False, width=120, height=40):
        cell_id = self.get_id()
        style = 'ellipse;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;'
        if is_key:
            name = f'<u>{escape_xml(name)}</u>'
        else:
            name = escape_xml(name)

        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=name, style=style, vertex='1', parent='1')
        ET.SubElement(cell, 'mxGeometry', x=str(x), y=str(y), width=str(width), height=str(height), **{'as': 'geometry'})
        return cell_id

    def add_isa(self, name, x, y, width=60, height=60):
        cell_id = self.get_id()
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(name), style='ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;', vertex='1', parent='1')
        ET.SubElement(cell, 'mxGeometry', x=str(x), y=str(y), width=str(width), height=str(height), **{'as': 'geometry'})
        return cell_id

    def add_relationship(self, name, x, y, width=120, height=80):
        cell_id = self.get_id()
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(name), style='rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;', vertex='1', parent='1')
        ET.SubElement(cell, 'mxGeometry', x=str(x), y=str(y), width=str(width), height=str(height), **{'as': 'geometry'})
        return cell_id

    def add_edge(self, source, target, label='', is_dashed=False):
        cell_id = self.get_id()
        style = 'endArrow=none;html=1;rounded=0;edgeStyle=orthogonalEdgeStyle;'
        if is_dashed:
            style += 'dashed=1;'
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(label), style=style, edge='1', parent='1', source=str(source), target=str(target))
        ET.SubElement(cell, 'mxGeometry', relative='1', **{'as': 'geometry'})
        return cell_id

    def add_straight_edge(self, source, target, label=''):
        cell_id = self.get_id()
        style = 'endArrow=none;html=1;rounded=0;'
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(label), style=style, edge='1', parent='1', source=str(source), target=str(target))
        ET.SubElement(cell, 'mxGeometry', relative='1', **{'as': 'geometry'})
        return cell_id

    def to_xml(self):
        return ET.tostring(self.mxfile, encoding='unicode')

def place_attributes(diagram, entity_id, center_x, center_y, attributes, radius_x=250, radius_y=250, start_angle=0, end_angle=2*math.pi):
    if len(attributes) == 0: return
    angle_range = end_angle - start_angle
    if abs(angle_range - 2*math.pi) < 0.01:
        angle_step = angle_range / len(attributes)
    else:
        angle_step = angle_range / max(1, len(attributes) - 1)

    for i, (attr, is_key) in enumerate(attributes):
        angle = start_angle + i * angle_step
        ax = center_x + radius_x * math.cos(angle)
        ay = center_y + radius_y * math.sin(angle)
        attr_id = diagram.add_attribute(attr, ax - 60, ay - 20, is_key=is_key)
        diagram.add_straight_edge(entity_id, attr_id)

def main():
    diagram = DrawioDiagram()

    # Data Structure definition
    models = {
        'User': [('id', True), ('username', False), ('email', False), ('password', False), ('nama', False), ('role', False), ('isActive', False), ('createdAt', False), ('updatedAt', False)],
        'AcademicYear': [('id', True), ('year', False), ('startDate', False), ('endDate', False), ('isActive', False), ('description', False), ('createdAt', False), ('updatedAt', False)],
        'Class': [('id', True), ('name', False), ('grade', False), ('sppAmount', False), ('maxCapacity', False), ('isActive', False), ('description', False), ('createdAt', False), ('updatedAt', False)],
        'StudentClass': [('id', True), ('enrollmentDate', False), ('endDate', False), ('isActive', False), ('notes', False), ('createdAt', False), ('updatedAt', False)],
        'BillingTemplate': [('id', True), ('name', False), ('type', False), ('dueDate', False), ('amount', False), ('isRecurring', False), ('description', False), ('isActive', False), ('createdAt', False), ('updatedAt', False)],
        'BillingItem': [('id', True), ('itemName', False), ('description', False), ('amount', False), ('quantity', False), ('isRequired', False), ('isOptional', False), ('createdAt', False), ('updatedAt', False)],
        'Billing': [('id', True), ('billNumber', False), ('type', False), ('month', False), ('year', False), ('subtotal', False), ('discount', False), ('discountReason', False), ('totalAmount', False), ('paidAmount', False), ('allowInstallments', False), ('installmentCount', False), ('installmentAmount', False), ('status', False), ('dueDate', False), ('billDate', False), ('waivedAt', False), ('waivedReason', False), ('description', False), ('notes', False), ('createdAt', False), ('updatedAt', False), ('lastReminderSentAt', False)],
        'Payment': [('id', True), ('paymentNumber', False), ('method', False), ('amount', False), ('adminFee', False), ('totalPaid', False), ('status', False), ('externalId', False), ('vaNumber', False), ('qrCode', False), ('deeplink', False), ('expiredAt', False), ('paidAt', False), ('receiptUrl', False), ('notes', False), ('createdAt', False), ('updatedAt', False)],
        'PaymentDetail': [('id', True), ('description', False), ('amount', False), ('notes', False), ('createdAt', False)],
        'Installment': [('id', True), ('installmentNo', False), ('amount', False), ('dueDate', False), ('isPaid', False), ('paidAmount', False), ('paidAt', False), ('notes', False), ('createdAt', False), ('updatedAt', False)],
        'ActivityLog': [('id', True), ('action', False), ('entity', False), ('entityId', False), ('details', False), ('createdAt', False)],
        'Expense': [('id', True), ('date', False), ('category', False), ('description', False), ('amount', False), ('status', False), ('receipt', False), ('createdAt', False), ('updatedAt', False)],
        'SystemSettings': [('id', True), ('key', False), ('value', False), ('type', False), ('category', False), ('description', False), ('createdAt', False), ('updatedAt', False)],
        'NotificationLog': [('id', True), ('type', False), ('status', False), ('recipient', False), ('subject', False), ('content', False), ('template', False), ('metadata', False), ('sentAt', False), ('createdAt', False)],
        'Student': [('id', True), ('nama', False), ('nisn', False), ('noTelp', False), ('email', False), ('alamat', False), ('namaOrangTua', False), ('noTelpOrangTua', False), ('status', False), ('virtualAccount', False), ('enrollmentType', False), ('admissionDate', False), ('graduationDate', False), ('photoUrl', False), ('birthPlace', False), ('birthDate', False), ('gender', False), ('religion', False), ('createdAt', False), ('updatedAt', False)],
        'NewStudent': [('id', True), ('nama', False), ('nisn', False), ('tempatLahir', False), ('tanggalLahir', False), ('jenisKelamin', False), ('agama', False), ('alamat', False), ('noTelp', False), ('email', False), ('namaAyah', False), ('namaIbu', False), ('noTelpOrtu', False), ('pekerjaanAyah', False), ('pekerjaanIbu', False), ('enrollmentType', False), ('kelasYangDituju', False), ('asalSekolah', False), ('fotoSiswa', False), ('aktaKelahiran', False), ('kartuKeluarga', False), ('ijazahSebelumnya', False), ('registrationDate', False), ('registrationFee', False), ('registrationPaid', False), ('paidAt', False), ('virtualAccount', False), ('approvalStatus', False), ('approvedAt', False), ('rejectionReason', False), ('notes', False), ('createdAt', False), ('updatedAt', False)],
        'NewStudentTransaction': [('id', True), ('paymentMethod', False), ('amount', False), ('adminFee', False), ('totalAmount', False), ('status', False), ('externalId', False), ('vaNumber', False), ('expiredAt', False), ('paidAt', False), ('description', False), ('buktiPembayaran', False), ('createdAt', False), ('updatedAt', False)]
    }

    grid_size = 5
    x_spacing = 1500
    y_spacing = 1500
    start_x = 1000
    start_y = 1000

    entity_ids = {}
    entity_coords = {}

    idx = 0
    for name, attrs in models.items():
        row = idx // grid_size
        col = idx % grid_size
        x = start_x + col * x_spacing
        y = start_y + row * y_spacing

        ent_id = diagram.add_entity(name, x, y)
        entity_ids[name] = ent_id
        entity_coords[name] = (x, y)
        place_attributes(diagram, ent_id, x + 60, y + 30, attrs)
        idx += 1

    # RELATIONS
    relations = [
        ('User', 'ActivityLog', 'Mencatat'),
        ('User', 'NotificationLog', 'Menerima'),
        ('AcademicYear', 'StudentClass', 'Memiliki'),
        ('Class', 'StudentClass', 'Ditempati'),
        ('Student', 'StudentClass', 'Terdaftar Di'),
        ('AcademicYear', 'BillingTemplate', 'Menentukan'),
        ('Class', 'BillingTemplate', 'Ditargetkan Oleh'),
        ('BillingTemplate', 'BillingItem', 'Memiliki Detail'),
        ('Student', 'Billing', 'Ditagihkan Ke'),
        ('BillingTemplate', 'Billing', 'Menjadi Dasar'),
        ('AcademicYear', 'Billing', 'Periode'),
        ('Billing', 'Payment', 'Dibayar Melalui'),
        ('Billing', 'Installment', 'Dicicil Melalui'),
        ('Payment', 'PaymentDetail', 'Terdiri Dari'),
        ('NewStudent', 'NewStudentTransaction', 'Melakukan'),
        ('AcademicYear', 'NewStudent', 'Mendaftar Pada')
    ]

    for e1, e2, label in relations:
        if e1 in entity_ids and e2 in entity_ids:
            id1 = entity_ids[e1]
            id2 = entity_ids[e2]

            x1, y1 = entity_coords[e1]
            x2, y2 = entity_coords[e2]
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2

            # Geser sedikit rhombusnya agar tidak numpuk tepat di tengah jika garis lurus bertumpuk,
            # Namun karena layout grid sangat besar, biasanya aman.
            rel_id = diagram.add_relationship(label, mx, my)
            diagram.add_edge(id1, rel_id, '1')
            diagram.add_edge(rel_id, id2, 'N')


    # Tambahkan ISA
    user_x, user_y = entity_coords['User']
    isa_id = diagram.add_isa('ISA', user_x + 60 - 30, user_y + 400)
    diagram.add_straight_edge(entity_ids['User'], isa_id)

    # Sub-roles (Letakkan di bawah ISA)
    roles = ['Admin', 'Kepala Sekolah', 'Bendahara']
    for i, role in enumerate(roles):
        r_x = user_x - 300 + (i * 300)
        r_y = user_y + 600
        r_id = diagram.add_entity(role, r_x, r_y)
        diagram.add_straight_edge(isa_id, r_id)

    diagram.add_straight_edge(isa_id, entity_ids['Student'])
    diagram.add_straight_edge(isa_id, entity_ids['NewStudent'])

    os.makedirs('docs', exist_ok=True)
    with open('docs/erd_simbol_lama.drawio', 'w') as f:
        f.write(diagram.to_xml())

if __name__ == '__main__':
    main()
