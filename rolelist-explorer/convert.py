import csv
import json

def parse_rolelists_tsv():
    """
    Parse rolelists.tsv and create rolelists.json with column data.
    Each key represents the number of non-blank entries in a column,
    and the value is a list of those entries in order.
    """
    
    # dictionary to store the results
    rolelists = {}
    
    try:

        # read the TSV file using csv with a tab delimiter
        with open('rolelists.tsv', 'r', encoding='utf-8') as tsv_file:
            reader = csv.reader(tsv_file, delimiter='\t')
            rows = list(reader)
            
            if not rows:
                print("Warning: TSV file is empty")
                return

            # determine the number of columns using the longest row
            max_columns = max(len(row) for row in rows) if rows else 0

            # process each column
            for col_index in range(max_columns):
                column_entries = []
                
                # collect non-blank entries from each row
                for row in rows:
                    if col_index < len(row) and row[col_index].strip():
                        column_entries.append(row[col_index].strip())
                
                # add to results if found
                if column_entries:
                    key = str(len(column_entries))
                    rolelists[key] = column_entries
        
        # write the results to JSON file
        with open('rolelists.json', 'w', encoding='utf-8') as json_file:
            json.dump(rolelists, json_file, indent=2, ensure_ascii=False)
        
        print(f"Successfully processed {len(rolelists)} columns")
        print(f"Column lengths found: {sorted(rolelists.keys(), key=int)}")
        
    except FileNotFoundError:
        print("Error: rolelists.tsv file not found")
    except Exception as e:
        print(f"Error processing file: {e}")

if __name__ == "__main__":
    parse_rolelists_tsv()