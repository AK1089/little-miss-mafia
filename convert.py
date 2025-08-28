import csv
import json

def convert_tsv_to_json(input_file, output_file):
    roles = []
    
    with open(input_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter='\t')
        
        for row in reader:
            if len(row) >= 5:
                role_id = int(row[0])
                name = row[1]
                archetype = row[2]
                abilities_text = row[3]
                wincon = row[4]
                
                abilities = [ability.strip() for ability in abilities_text.split(' // ')]
                
                name = name.replace("Mr", "Mr.")
                name = name.replace("Little Miss ", "Little Miss<br>")

                role_entry = {
                    "id": role_id,
                    "name": name,
                    "image": f"/images/Artboard {role_id}.svg",
                    "abilities": abilities,
                    "archetype": f"{archetype}",
                    "wincon": wincon
                }
                
                roles.append(role_entry)
    
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(roles, file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    convert_tsv_to_json("roles.tsv", "roles.json")