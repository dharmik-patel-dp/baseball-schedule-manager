# 📊 CSV Upload Guide for Baseball/Softball Schedule Manager

## 🎯 **Perfect CSV Format for Bulk Upload**

This guide shows you exactly how to format your CSV file for bulk uploading schedules into the system.

## 📋 **Required CSV Columns (In Order)**

| Column | Required | Description | Example Values |
|--------|----------|-------------|----------------|
| `season` | ✅ | Season name | Spring, Summer, Fall |
| `event_type` | ✅ | Sport type | Baseball, Softball |
| `day` | ✅ | Day of week | Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday |
| `date` | ✅ | Game date | 2024-03-15 (YYYY-MM-DD format) |
| `start_time` | ✅ | Start time | 6:00, 7:30, 9:00, 10:30 |
| `am_pm` | ✅ | Time period | AM, PM |
| `division` | ✅ | Age/level division | Minor 9/10, 8U, 16U, Senior 13/16 |
| `home_team` | ✅ | Home team name | Tigers, 8U Duke Blue Devils, Lowell 8U District |
| `home_coach` | ✅ | Home team coach | Alex Normandie, Matt LeLacheur, Burr McCutcheon |
| `visitor_team` | ✅ | Visitor team name | Lions, 8U Florida State Seminoles, Lowell 8U District |
| `visitor_coach` | ✅ | Visitor team coach | Mike Upton, Ashley Schwagor, George Yfantopulos |
| `venue` | ✅ | Game location | LeBlanc Field - LeBlanc Park, Mahoney Field - Father McGuire Park |
| `plate_umpire` | ✅ | Plate umpire name | Dylan LeLacheur, Arthur DeSouza, Connor Stevens |
| `base_umpire` | ✅ | Base umpire name | Scott Patenaude, Brady Foote, Jack Duffy |
| `concession_stand` | ✅ | Concession stand | Boutin Stand - LeBlanc Park, Botto Stand - Shedd Upper, No Concession |
| `concession_staff` | ❌ | Staff working concession | Dylan LeLacheur, Emily Lelacheur, Kate LeLacheur |

## 🏟️ **Available Concession Stands**

### **LeBlanc Park**
- `Boutin Stand - LeBlanc Park`

### **Shedd Park**
- `Botto Stand - Shedd Upper`
- `Shedd Lower Stand - Shedd Park`

### **Gage Park**
- `Finn Field Stand - Gage Park`

### **Highland Park**
- `Highlands Park Stand - Highland Park`

### **Pawtucketville**
- `Montbleau Stand - Montbleau Field`

### **Father McGuire Park**
- `Mahoney Stand - Father McGuire Park`

### **McPherson Park**
- `McPherson Stand - McPherson Park`

### **Page Field**
- `Page Field Stand - Page Field`

### **No Concession**
- `No Concession`

## ⚾ **Available Baseball Teams**

- A's, Bulls, Cubs, Devil Rays, Giants, Grasshoppers, Grizzlies
- Hooks, Hot Rods, Iron Birds, Mariners, Marlins, Nationals
- Padres, Phillios, Red Sox, Red Wings, Reds, Riverdogs
- Rock Hounds, Rockies, Tides, White Sox, Yard Goats

## 🥎 **Available Softball Teams**

- 8U Duke Blue Devils, 8U Florida State Seminoles, 8U Maryland Terrapins
- 8U Michigan State Spartans, 8U Notre Dame Fighting Irish, 8U Tennessee Lady Vols
- 8U UMass Lowell Riverhawks, 8U Washington Huskies
- 10U Chelmsford Longhorns, 10U Dracut Grave Diggers, 10U Lowell Huskies
- 10U Tyngsboro Red, 10U Westford Team 1
- 12U Lowell Red, 12U Lowell Gray
- 16U Lowell Red, 16U Lowell Gray

## 🏟️ **Available Venues**

### **LeBlanc Park**
- `LeBlanc Field - LeBlanc Park`
- `McNamara Field - LeBlanc Park`

### **Shedd Park**
- `Shedd Upper - Shedd Park`
- `Shedd Lower - Shedd Park`
- `Gresco Field - Shedd Park`

### **Gage Park**
- `Finn Field - Gage Park`
- `Whalen Field - Gage Park`

### **Highland Park**
- `DeCosta Field - Highland Park`
- `Loucraft Field - Highland Park`
- `Hadley Field - Highlands`

### **Pawtucketville**
- `Campbell Field (Flaggies) - Pawtucketville`
- `Montbleau Field - Pawtucketville`

### **Other Locations**
- `Ryan Field - South Lowell`
- `Mahoney Field - Father McGuire Park`
- `McPherson Field #1 - Centralville`
- `McPherson Field #2 - Centralville`
- `McPherson Field #3 - Centralville`
- `Page Field - Shedd Park`

## 👨‍🏫 **Available Coaches**

- Alex Normandie, Brendan Akashian, Brian Durkin, Cesar Ortiz
- Dave Brown, Greg Kay, John Morris, Matt LeLacheur
- Mike Upton, Pate Donavan, Steve McNamara, Tommy Zahareas
- Angelica Molligi, Ashley Schwagor, Burr McCutcheon, George Yfantopulos
- Kara Koch, Randy Negron, Robert McMahon, Bill Florence
- Mike Doucette, Sam Valles, Steve Davidson, Rich Gallo, Rudolph Beiler

## 📅 **Date Format**

**IMPORTANT**: Use the exact format: `YYYY-MM-DD`

- ✅ **Correct**: `2024-03-15`, `2024-06-22`, `2024-09-14`
- ❌ **Wrong**: `03/15/2024`, `15-03-2024`, `March 15, 2024`

## ⏰ **Time Format**

**IMPORTANT**: Use the exact format: `HH:MM`

- ✅ **Correct**: `6:00`, `7:30`, `9:00`, `10:30`
- ❌ **Wrong**: `6:00 PM`, `6PM`, `6.00`

## 🎯 **How to Use This Template**

### **Step 1: Download the Sample**
- Use the `sample-schedules.csv` file as your starting point
- Open it in Excel, Google Sheets, or any spreadsheet application

### **Step 2: Modify the Data**
- Keep the header row exactly as shown
- Replace the sample data with your actual schedule information
- Make sure all required fields are filled

### **Step 3: Save as CSV**
- Save your file with `.csv` extension
- Ensure UTF-8 encoding for special characters

### **Step 4: Upload**
- Go to Admin Panel → Bulk Upload via CSV
- Drag & drop your CSV file or click Browse
- Review the preview
- Click "Upload CSV"

## ⚠️ **Common Mistakes to Avoid**

1. **Missing Headers**: Don't change the column names
2. **Wrong Date Format**: Use YYYY-MM-DD only
3. **Wrong Time Format**: Use HH:MM only
4. **Missing Required Fields**: All fields marked ✅ must have values
5. **Extra Spaces**: Avoid leading/trailing spaces in data
6. **Special Characters**: Use standard characters only

## 🔍 **Validation Rules**

- **Season**: Must be Spring, Summer, or Fall
- **Event Type**: Must be Baseball or Softball
- **Day**: Must be a valid day of the week
- **Date**: Must be in YYYY-MM-DD format
- **Start Time**: Must be in HH:MM format
- **AM/PM**: Must be AM or PM
- **Division**: Must match available divisions
- **Teams**: Must match available team names
- **Coaches**: Must match available coach names
- **Venues**: Must match available venue names
- **Umpires**: Must match available staff names
- **Concession Stand**: Must match available stand names

## 📊 **Sample CSV Row**

```csv
Spring,Baseball,Saturday,2024-03-15,6:00,PM,Minor 9/10,Tigers,Alex Normandie,Lions,Mike Upton,LeBlanc Field - LeBlanc Park,Dylan LeLacheur,Scott Patenaude,Boutin Stand - LeBlanc Park,Dylan LeLacheur
```

## 🚀 **Ready to Upload!**

Your CSV file is now ready for bulk upload. The system will validate all data and show you exactly how many records were successfully imported.

**Need Help?** Check the admin panel for any error messages during upload.
