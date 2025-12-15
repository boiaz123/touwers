# 🎮 LEVEL DESIGNER - QUICK START GUIDE

## What Is This?

A **visual level design tool** that lets you create custom tower defense levels by:
- ✅ Clicking to draw enemy paths
- ✅ Configuring enemy waves
- ✅ Customizing colors and visuals
- ✅ Exporting complete level code

**No programming required!**

---

## 🚀 Get Started in 2 Minutes

### 1️⃣ Start the Designer
```bash
npm start
```
Then open browser to:
```
http://localhost:3000/level-designer.html
```

### 2️⃣ You'll See
```
┌─────────────────────────────────────────────────┐
│  CANVAS (click to draw path)    │ FORM         │
│                                  │ • Name       │
│  ☆ (click points)                │ • Waves      │
│   \                               │ • Colors     │
│    ☆                              │              │
│     \                              │              │
│      ☆                             │              │
│                                    │              │
└─────────────────────────────────────────────────┘
```

### 3️⃣ Design (5-10 minutes)
- Click canvas to add path points (green=start, red=end)
- Switch to castle mode, click to place goal
- Fill form: name, difficulty, waves
- Customize colors
- Export!

### 4️⃣ Integrate (5 minutes)
- Copy exported `LevelN.js` file
- Add to `public/js/entities/levels/`
- Update `LevelFactory.js` (2 lines)
- Test in game!

**Total: ~30 minutes per level**

---

## 📚 Documentation (Pick Your Style)

### 🏃 I'm Impatient
→ [LEVEL_DESIGNER_QUICKREF.md](LEVEL_DESIGNER_QUICKREF.md) (2 min)
- Just the essentials
- Controls, tips, quick lookup

### 🚶 I Want a Walkthrough
→ [LEVEL_DESIGNER_WALKTHROUGH.md](LEVEL_DESIGNER_WALKTHROUGH.md) (30 min)
- Complete example
- Step-by-step instructions
- Hands-on learning

### 📖 I Want to Learn Everything
→ [LEVEL_DESIGNER_GUIDE.md](LEVEL_DESIGNER_GUIDE.md) (20 min)
- All features explained
- Tips & best practices
- Troubleshooting

### 🔗 I'm Adding to the Game
→ [LEVEL_INTEGRATION_GUIDE.md](LEVEL_INTEGRATION_GUIDE.md) (10 min)
- How to integrate levels
- Complete examples
- LevelFactory.js walkthrough

### 📋 I'm Testing/Validating
→ [LEVEL_DESIGNER_TESTING.md](LEVEL_DESIGNER_TESTING.md) (15 min)
- Validation checklist
- Test procedures
- Quality assurance

### 🤔 I'm Lost
→ [LEVEL_DESIGNER_INDEX.md](LEVEL_DESIGNER_INDEX.md) (5 min)
- Navigation by use case
- File structure
- Quick links

---

## 🎯 Key Features

### Path Editor
```
✓ Click to add waypoints
✓ Right-click to undo
✓ Visual preview (colored points)
✓ Grid alignment (60×33.75 cells)
✓ Undo/clear buttons
```

### Wave Configuration
```
✓ Create multiple waves
✓ Set: enemy count, health, speed, spawn time
✓ Mix different enemy types
✓ Pattern repeats (e.g., basic→archer→basic)
✓ Difficulty progression
```

### Customization
```
✓ Grass colors (4-color gradient)
✓ Path color
✓ Bush/rock colors
✓ Density controls
✓ Real-time preview
```

### Code Generation
```
✓ Real-time preview
✓ Valid JavaScript Level class
✓ Copy to clipboard
✓ Download as file
✓ Ready to integrate
```

---

## 📍 File Locations

### Code Files
```
public/level-designer.html                    ← Main UI
public/js/level-designer/LevelDesigner.js    ← Core logic
```

### Documentation
```
README_LEVEL_DESIGNER.md                     ← Master guide (READ THIS FIRST)
LEVEL_DESIGNER_INDEX.md                      ← Documentation index
LEVEL_DESIGNER_README.md                     ← Overview
LEVEL_DESIGNER_GUIDE.md                      ← Detailed guide
LEVEL_DESIGNER_QUICKREF.md                   ← Quick reference
LEVEL_DESIGNER_WALKTHROUGH.md                ← Step-by-step example
LEVEL_INTEGRATION_GUIDE.md                   ← How to add to game
LEVEL_DESIGNER_TESTING.md                    ← Testing checklist
LEVEL_DESIGNER_IMPLEMENTATION.md             ← Technical details
```

---

## 🎨 Example: Creating "The Dragon Pass"

### Step 1: Draw Path (2 min)
```
Click left-middle    → Point 1 (green, start)
Click center-up      → Point 2 (blue)
Click center-bottom  → Point 3 (blue)
Click right-middle   → Point 4 (red, end)

Result: S-curve path
```

### Step 2: Configure (2 min)
```
Level Name:    "The Dragon Pass"
Level Number:  6
Difficulty:    Hard
Max Waves:     12
```

### Step 3: Customize Colors (1 min)
```
Grass: Dark purples/blues
Path:  Brown
Bushes: Dark green
Result: Dark, moody theme
```

### Step 4: Create Waves (3 min)
```
Wave 1: 8 basic enemies, 1.0 HP, spawn every 1.5s
Wave 2: 15 mixed (basic+archer), 1.2 HP, spawn every 1.3s
Wave 3: 20 varied, 1.4 HP, spawn every 1.0s
...add more as needed...
```

### Step 5: Export (1 min)
```
Click "📥 Export Level" → Level6.js downloads
```

### Step 6: Integrate (5 min)
```
1. Copy Level6.js to public/js/entities/levels/
2. Add import to LevelFactory.js
3. Add case in switch statement
4. Add to level list
5. Test in game!
```

**Done! Custom level created and integrated! 🎉**

---

## 🎮 Enemy Types (8 Available)

| Enemy | Type | Use |
|-------|------|-----|
| `basic` | Standard | Easy waves |
| `villager` | Weak | Early game |
| `archer` | Ranged | Mid game |
| `beefyenemy` | Tanky | Tough enemies |
| `knight` | Armored | Medium difficulty |
| `shieldknight` | Heavy armor | Hard mode |
| `mage` | Magic attacks | Varied gameplay |
| `frog` | Jumping | Special behavior |

---

## 💡 Design Tips

### Good Paths
✅ 5-10 waypoints  
✅ Curved, winding  
✅ Multiple turns  
✅ Varied directions  

### Good Waves
✅ Gradual difficulty increase  
✅ Early waves easy  
✅ Late waves hard  
✅ Mix enemy types  

### Good Colors
✅ Thematic (match level name)  
✅ Grass gradient  
✅ Path contrasts with grass  
✅ Consistent throughout  

---

## ⚡ Quick Tips

### Undo Path Point
Right-click on canvas or click "↶ Undo" button

### Clear All Paths
Click "🗑️ Clear Path" button

### Copy Code
Click "📋 Copy Generated Code" → Paste in editor

### Download File
Click "📥 Export Level" → Get LevelN.js

### Change Difficulty
Select in dropdown: Easy, Medium, Hard, Nightmare

### Add More Waves
Click "+ Add Wave" button

### Remove a Wave
Click "✕" button on wave card

### Edit Enemy Pattern
Click dropdowns, add/remove enemies with buttons

---

## 🔧 Coordinate System

The designer uses a **grid-based system**:
```
Grid Width:  60 cells (fixed)
Grid Height: 33.75 cells (fixed)
Cell Size:   32 pixels (scales with resolution)

Click on canvas 
    ↓
Convert to grid coordinates (0-60, 0-33.75)
    ↓
Stored in path array
    ↓
Generated code converts back to pixels
    ↓
Works on any screen resolution! ✓
```

---

## 🐛 Troubleshooting

### Path won't draw?
→ Make sure "🖌️ Draw Path" button is green (active)

### Designer won't load?
→ Check server: `npm start`, then `localhost:3000/level-designer.html`

### Level won't appear in game?
→ Verify file in `public/js/entities/levels/`, check LevelFactory.js

### Enemies in wrong location?
→ Path needs minimum 2 points, check they're valid

→ [Full troubleshooting](LEVEL_DESIGNER_GUIDE.md#troubleshooting)

---

## 📋 Integration Checklist

- [ ] Designer working at `localhost:3000/level-designer.html`
- [ ] Created path with 3+ points
- [ ] Configured level basics (name, difficulty)
- [ ] Added 1+ waves
- [ ] Clicked export or copy
- [ ] Copied/saved `LevelN.js`
- [ ] Placed file in `public/js/entities/levels/`
- [ ] Added import to `LevelFactory.js`
- [ ] Added case in switch statement
- [ ] Added to level list
- [ ] Refreshed browser
- [ ] Level appears in level select
- [ ] Can play level without errors

---

## 📞 Need Help?

| Question | Document |
|----------|----------|
| What does this do? | [LEVEL_DESIGNER_README.md](LEVEL_DESIGNER_README.md) |
| How do I use it? | [LEVEL_DESIGNER_GUIDE.md](LEVEL_DESIGNER_GUIDE.md) |
| Show me an example | [LEVEL_DESIGNER_WALKTHROUGH.md](LEVEL_DESIGNER_WALKTHROUGH.md) |
| Quick lookup | [LEVEL_DESIGNER_QUICKREF.md](LEVEL_DESIGNER_QUICKREF.md) |
| How to integrate? | [LEVEL_INTEGRATION_GUIDE.md](LEVEL_INTEGRATION_GUIDE.md) |
| I'm lost | [LEVEL_DESIGNER_INDEX.md](LEVEL_DESIGNER_INDEX.md) |

---

## ✅ You're Ready!

Everything you need is in place:
- ✅ Visual designer (no coding!)
- ✅ Complete documentation
- ✅ Step-by-step guide
- ✅ Integration workflow
- ✅ Quick reference
- ✅ Troubleshooting help

### Next Steps:
1. Open [http://localhost:3000/level-designer.html](http://localhost:3000/level-designer.html)
2. Click the canvas to draw
3. Follow [LEVEL_DESIGNER_WALKTHROUGH.md](LEVEL_DESIGNER_WALKTHROUGH.md) for detailed steps
4. Create your first level!

---

## 🎉 Let's Go!

You're 30 minutes away from creating your first custom tower defense level!

**Start designing now:** [http://localhost:3000/level-designer.html](http://localhost:3000/level-designer.html)

**Questions?** Check [README_LEVEL_DESIGNER.md](README_LEVEL_DESIGNER.md)

**Let's create! 🎮✨**
