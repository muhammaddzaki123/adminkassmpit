import xml.etree.ElementTree as ET
import os

def escape_xml(text):
    if not isinstance(text, str):
        return text
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")

NODE_WIDTH = 180
NODE_HEIGHT = 60
X_SPACING = 80
Y_SPACING = 40

class SitemapGenerator:
    def __init__(self, color, file_name):
        self.color = color
        self.file_name = file_name

        self.colors = {
            'Admin': {'fill': '#f8cecc', 'stroke': '#b85450', 'font': '#000000'},
            'Calon Siswa': {'fill': '#dae8fc', 'stroke': '#6c8ebf', 'font': '#000000'},
            'Kepala Sekolah': {'fill': '#d5e8d4', 'stroke': '#82b366', 'font': '#000000'},
            'Siswa': {'fill': '#ffe6cc', 'stroke': '#d79b00', 'font': '#000000'},
            'Bendahara': {'fill': '#e1d5e7', 'stroke': '#9673a6', 'font': '#000000'}
        }

        self.current_y = 50
        self.node_id_counter = 2

    def generate(self, tree_data):
        self.mxfile = ET.Element("mxfile", host="Electron", modified="2024-05-16T00:00:00.000Z", agent="Mozilla/5.0", version="24.4.0", type="device")
        self.diagram = ET.SubElement(self.mxfile, "diagram", name="Sitemap", id="sitemap_id")
        self.mxGraphModel = ET.SubElement(self.diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1169", pageHeight="827", math="0", shadow="0")
        self.root = ET.SubElement(self.mxGraphModel, "root")

        ET.SubElement(self.root, "mxCell", id="0")
        ET.SubElement(self.root, "mxCell", id="1", parent="0")

        self.current_y = 50
        self.layout(tree_data, 0)
        self.draw_node(tree_data, None)

        tree = ET.ElementTree(self.mxfile)
        ET.indent(tree, space="  ", level=0)
        os.makedirs(os.path.dirname(self.file_name), exist_ok=True)
        tree.write(self.file_name, encoding="utf-8", xml_declaration=True)
        print(f"Generated {self.file_name}")

    def layout(self, node, depth):
        if not node.get('children'):
            node['x'] = 50 + depth * (NODE_WIDTH + X_SPACING)
            node['y'] = self.current_y
            self.current_y += NODE_HEIGHT + Y_SPACING
            return node['y']
        else:
            children_y = []
            for child in node['children']:
                children_y.append(self.layout(child, depth + 1))

            node['x'] = 50 + depth * (NODE_WIDTH + X_SPACING)
            node['y'] = sum(children_y) / len(children_y)
            return node['y']

    def draw_node(self, node, parent_node_id):
        node_id = str(self.node_id_counter)
        self.node_id_counter += 1

        name = escape_xml(node['name'])
        c = self.colors.get(self.color, {'fill': '#ffffff', 'stroke': '#000000', 'font': '#000000'})
        style = f"rounded=1;whiteSpace=wrap;html=1;fillColor={c['fill']};strokeColor={c['stroke']};fontColor={c['font']};"

        cell = ET.SubElement(self.root, "mxCell", id=node_id, value=name, style=style, vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(node['x']), y=str(node['y']), width=str(NODE_WIDTH), height=str(NODE_HEIGHT), **{"as": "geometry"})

        if parent_node_id is not None:
            edge_id = str(self.node_id_counter)
            self.node_id_counter += 1
            edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            edge = ET.SubElement(self.root, "mxCell", id=edge_id, style=edge_style, edge="1", parent="1", source=parent_node_id, target=node_id)
            ET.SubElement(edge, "mxGeometry", relative="1", **{"as": "geometry"})

        for child in node.get('children', []):
            self.draw_node(child, node_id)

if __name__ == "__main__":
    admin_tree = {
        'name': '/admin',
        'children': [
            {'name': '/admin/academic-years'},
            {'name': '/admin/activity-log'},
            {'name': '/admin/classes'},
            {'name': '/admin/new-students'},
            {'name': '/admin/permissions'},
            {'name': '/admin/registrations'},
            {'name': '/admin/roles'},
            {'name': '/admin/settings'},
            {'name': '/admin/students', 'children': [
                {'name': '/admin/students/create'},
                {'name': '/admin/students/import'},
                {'name': '/admin/students/[id]/edit'},
            ]},
            {'name': '/admin/users'},
        ]
    }

    calon_siswa_tree = {
        'name': '/calon-siswa',
        'children': [
            {'name': '/calon-siswa/login'},
            {'name': '/calon-siswa/register'},
            {'name': '/calon-siswa/dashboard'},
        ]
    }

    headmaster_tree = {
        'name': '/headmaster',
        'children': [
            {'name': '/headmaster/reports'},
            {'name': '/headmaster/students'},
        ]
    }

    student_tree = {
        'name': '/student',
        'children': [
            {'name': '/student/dashboard'},
            {'name': '/student/history', 'children': [
                {'name': '/student/history/[id]'},
            ]},
            {'name': '/student/profile'},
            {'name': '/student/re-registration', 'children': [
                {'name': '/student/re-registration/pay'},
            ]},
            {'name': '/student/spp'},
        ]
    }

    treasurer_tree = {
        'name': '/treasurer',
        'children': [
            {'name': '/treasurer/backup'},
            {'name': '/treasurer/billing', 'children': [
                {'name': '/treasurer/billing/list'},
                {'name': '/treasurer/billing/[id]'},
            ]},
            {'name': '/treasurer/buku-besar'},
            {'name': '/treasurer/dashboard'},
            {'name': '/treasurer/expenses'},
            {'name': '/treasurer/history'},
            {'name': '/treasurer/payment', 'children': [
                {'name': '/treasurer/payment/manual'},
            ]},
            {'name': '/treasurer/re-registration'},
            {'name': '/treasurer/reports'},
            {'name': '/treasurer/spp'},
            {'name': '/treasurer/students'},
            {'name': '/treasurer/wa-reminder'},
        ]
    }

    SitemapGenerator('Admin', 'docs/sitemap_admin.drawio').generate(admin_tree)
    SitemapGenerator('Calon Siswa', 'docs/sitemap_calon_siswa.drawio').generate(calon_siswa_tree)
    SitemapGenerator('Kepala Sekolah', 'docs/sitemap_headmaster.drawio').generate(headmaster_tree)
    SitemapGenerator('Siswa', 'docs/sitemap_student.drawio').generate(student_tree)
    SitemapGenerator('Bendahara', 'docs/sitemap_treasurer.drawio').generate(treasurer_tree)
