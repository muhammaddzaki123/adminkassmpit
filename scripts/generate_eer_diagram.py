import os
import xml.etree.ElementTree as ET
import math

def escape_xml(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&apos;").replace('"', "&quot;")

class DrawioDiagram:
    def __init__(self):
        self.mxfile = ET.Element('mxfile')
        diagram = ET.SubElement(self.mxfile, 'diagram', id='eer_diagram', name='Page-1')
        self.model = ET.SubElement(diagram, 'mxGraphModel', dx='1000', dy='1000', grid='1', gridSize='10', guides='1', tooltips='1', connect='1', arrows='1', fold='1', page='1', pageScale='1', pageWidth='5000', pageHeight='5000', math='0', shadow='0')
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
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, value=escape_xml(name), style='rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;', vertex='1', parent='1')
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

    def add_edge(self, source, target):
        cell_id = self.get_id()
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, style='endArrow=none;html=1;rounded=0;', edge='1', parent='1', source=str(source), target=str(target))
        ET.SubElement(cell, 'mxGeometry', relative='1', **{'as': 'geometry'})
        return cell_id

    def add_edge_attribute(self, entity_id, attr_id):
        cell_id = self.get_id()
        cell = ET.SubElement(self.root, 'mxCell', id=cell_id, style='endArrow=none;html=1;rounded=0;strokeWidth=1;', edge='1', parent='1', source=str(entity_id), target=str(attr_id))
        ET.SubElement(cell, 'mxGeometry', relative='1', **{'as': 'geometry'})
        return cell_id

    def to_xml(self):
        return ET.tostring(self.mxfile, encoding='unicode')

def main():
    diagram = DrawioDiagram()

    user_x, user_y = 2500, 500
    user_id = diagram.add_entity('User', user_x, user_y)

    user_attributes = [
        ('id', True), ('username', False), ('email', False), ('password', False),
        ('nama', False), ('role', False), ('isActive', False),
        ('createdAt', False), ('updatedAt', False)
    ]

    def place_attributes(entity_id, center_x, center_y, attributes, radius_x=200, radius_y=150, start_angle=0, end_angle=2*math.pi):
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
            diagram.add_edge_attribute(entity_id, attr_id)

    place_attributes(user_id, user_x + 60, user_y + 30, user_attributes, radius_x=350, radius_y=250, start_angle=-math.pi*0.9, end_angle=-math.pi*0.1)

    isa_x, isa_y = user_x + 30, user_y + 350
    isa_id = diagram.add_isa('ISA', isa_x, isa_y)
    diagram.add_edge(user_id, isa_id)

    sub_entities = [
        ('Admin', []),
        ('Kepala Sekolah', []),
        ('Bendahara', []),
        ('Siswa', [
            ('id', True), ('nama', False), ('nisn', False), ('noTelp', False),
            ('email', False), ('alamat', False), ('namaOrangTua', False),
            ('noTelpOrangTua', False), ('status', False), ('virtualAccount', False),
            ('enrollmentType', False), ('admissionDate', False), ('graduationDate', False)
        ]),
        ('Calon Siswa', [
            ('id', True), ('nama', False), ('nisn', False), ('tempatLahir', False),
            ('tanggalLahir', False), ('jenisKelamin', False), ('agama', False),
            ('alamat', False), ('noTelp', False), ('email', False), ('namaAyah', False),
            ('namaIbu', False), ('noTelpOrtu', False), ('pekerjaanAyah', False),
            ('pekerjaanIbu', False)
        ])
    ]

    num_subs = len(sub_entities)
    spacing = 800
    start_x = isa_x - (num_subs - 1) * spacing / 2

    for i, (name, attrs) in enumerate(sub_entities):
        sx = start_x + i * spacing
        sy = isa_y + 300
        ent_id = diagram.add_entity(name, sx, sy)
        diagram.add_edge(isa_id, ent_id)

        if attrs:
            place_attributes(ent_id, sx + 60, sy + 30, attrs, radius_x=350, radius_y=350, start_angle=0, end_angle=2*math.pi)

    os.makedirs('docs', exist_ok=True)
    with open('docs/erd_simbol_lama.drawio', 'w') as f:
        f.write(diagram.to_xml())

if __name__ == '__main__':
    main()
