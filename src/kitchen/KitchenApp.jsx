import React, { useState, useMemo, useEffect } from "react";
import Footer from "../ui/Footer";
import { APP_NAME } from "../config";

/* ================= THEME ================= */
const C = {
  bg: "#FFF1F6",
  card: "#FFFFFF",
  border: "#F8BBD0",
  soft: "#FDE7EF",
  softer: "#FCD9E8",
  rose: "#D81B60",
  deep: "#AD1457",
  brown: "#5D4037",
  brownSoft: "#8D6E63",
  green: "#2E7D32",
  amber: "#B26A00",
};

const PATTERN =
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'>
      <g fill='none' stroke='#F3A8C6' stroke-width='2' opacity='0.45' stroke-linecap='round'>
        <circle cx='52' cy='54' r='28'/><circle cx='52' cy='54' r='17'/>
        <ellipse cx='190' cy='48' rx='26' ry='7'/><path d='M164 48 q26 30 52 0'/>
        <ellipse cx='72' cy='176' rx='9' ry='13'/><line x1='72' y1='189' x2='72' y2='224'/>
        <line x1='236' y1='150' x2='236' y2='190'/>
        <line x1='230' y1='150' x2='230' y2='162'/><line x1='242' y1='150' x2='242' y2='162'/>
        <line x1='236' y1='190' x2='236' y2='214'/>
      </g>
      <g fill='#F3A8C6' opacity='0.4'>
        <circle cx='150' cy='150' r='5'/>
        <circle cx='150' cy='138' r='5.5'/><circle cx='161' cy='146' r='5.5'/>
        <circle cx='157' cy='159' r='5.5'/><circle cx='143' cy='159' r='5.5'/>
        <circle cx='139' cy='146' r='5.5'/>
        <circle cx='30' cy='250' r='4'/>
        <circle cx='30' cy='241' r='4.4'/><circle cx='38' cy='247' r='4.4'/>
        <circle cx='35' cy='257' r='4.4'/><circle cx='25' cy='257' r='4.4'/>
        <circle cx='22' cy='247' r='4.4'/>
        <circle cx='232' cy='252' r='4'/>
        <circle cx='232' cy='243' r='4.4'/><circle cx='240' cy='249' r='4.4'/>
        <circle cx='237' cy='259' r='4.4'/><circle cx='227' cy='259' r='4.4'/>
        <circle cx='224' cy='249' r='4.4'/>
      </g>
    </svg>`
  ) +
  "\")";

/* ================= PORTION FACTORS (age matters) ================= */
function portionFactor(age) {
  if (age >= 13) return 1.0;
  if (age >= 7) return 0.75;
  if (age >= 3) return 0.5;
  return 0.25;
}
function ageBandLabel(age) {
  if (age >= 13) return "Adult · 1.0";
  if (age >= 7) return "Child 7–12 · 0.75";
  if (age >= 3) return "Child 3–6 · 0.5";
  return "Toddler · 0.25";
}

/* ================= PANTRY SEED ================= */
let _pid = 1;
// New users start with an EMPTY Food Store. Seed provides the catalog + sensible
// low-stock thresholds; quantities begin at 0 so users add what they actually own.
const P = (name, cat, qty, unit, low) => ({ id: _pid++, name, cat, qty: 0, unit, low });
const SEED_PANTRY = [
  P("Rice", "Grains", 5000, "g", 1000),
  P("Beans", "Grains", 2000, "g", 500),
  P("Garri", "Grains", 3000, "g", 800),
  P("Yam", "Tubers", 3000, "g", 800),
  P("Yam flour (elubo)", "Grains", 1000, "g", 300),
  P("Okpa flour", "Grains", 500, "g", 200),
  P("Flour", "Grains", 1000, "g", 300),
  P("Oats", "Grains", 500, "g", 150),
  P("Pap (ogi)", "Grains", 500, "g", 150),
  P("Noodles", "Grains", 6, "packs", 2),
  P("Bread", "Grains", 12, "slices", 4),
  P("Egusi (ground)", "Soup items", 600, "g", 150),
  P("Palm fruit concentrate", "Soup items", 400, "g", 150),
  P("Kuka powder", "Soup items", 100, "g", 30),
  P("Crayfish (ground)", "Soup items", 250, "g", 60),
  P("Ogiri", "Soup items", 30, "g", 10),
  P("Locust beans (iru)", "Soup items", 50, "g", 15),
  P("Potash", "Soup items", 50, "g", 10),
  P("Ehu seeds", "Soup items", 10, "g", 4),
  P("Cocoyam", "Tubers", 500, "g", 200),
  P("Abacha (cassava shreds)", "Soup items", 400, "g", 150),
  P("Ugba", "Soup items", 100, "g", 30),
  P("Palm oil", "Oils", 2000, "ml", 400),
  P("Vegetable oil", "Oils", 2000, "ml", 400),
  P("Groundnut oil", "Oils", 500, "ml", 150),
  P("Butter", "Oils", 250, "g", 80),
  P("Chicken", "Protein", 2000, "g", 500),
  P("Beef", "Protein", 1500, "g", 400),
  P("Assorted meat", "Protein", 1000, "g", 300),
  P("Cow foot", "Protein", 0, "g", 300),
  P("Catfish", "Protein", 0, "g", 300),
  P("Dried fish", "Protein", 500, "g", 150),
  P("Stockfish", "Protein", 300, "g", 100),
  P("Periwinkle", "Protein", 0, "g", 100),
  P("Liver", "Protein", 300, "g", 100),
  P("Eggs", "Protein", 12, "pcs", 6),
  P("Plantain", "Fruits & Veg", 6, "pcs", 3),
  P("Tomatoes", "Fruits & Veg", 10, "pcs", 4),
  P("Tomato paste", "Fruits & Veg", 200, "g", 70),
  P("Fresh pepper", "Fruits & Veg", 8, "pcs", 3),
  P("Tatashe", "Fruits & Veg", 4, "pcs", 2),
  P("Onions", "Fruits & Veg", 8, "pcs", 3),
  P("Carrot", "Fruits & Veg", 4, "pcs", 2),
  P("Green pepper", "Fruits & Veg", 3, "pcs", 1),
  P("Green beans", "Fruits & Veg", 200, "g", 60),
  P("Sweet corn", "Fruits & Veg", 200, "g", 60),
  P("Garden eggs", "Fruits & Veg", 6, "pcs", 2),
  P("Ugu leaves", "Vegetables", 300, "g", 100),
  P("Waterleaf", "Vegetables", 0, "g", 100),
  P("Bitterleaf (washed)", "Vegetables", 200, "g", 60),
  P("Oha leaves", "Vegetables", 0, "g", 50),
  P("Spinach", "Vegetables", 400, "g", 120),
  P("Ewedu leaves", "Vegetables", 100, "g", 40),
  P("Scent leaves", "Vegetables", 50, "g", 15),
  P("Utazi", "Vegetables", 30, "g", 10),
  P("Uziza", "Vegetables", 20, "g", 8),
  P("Eru (okazi) leaves", "Vegetables", 200, "g", 60),
  P("Corn flour", "Grains", 1000, "g", 300),
  P("Dried corn", "Grains", 800, "g", 250),
  P("Achu spice", "Spices", 30, "g", 10),
  P("Milk", "Dairy & Drinks", 500, "ml", 150),
  P("Tea bags", "Dairy & Drinks", 20, "pcs", 6),
  P("Sugar", "Spices", 500, "g", 150),
  P("Salt", "Spices", 500, "g", 100),
  P("Seasoning cubes", "Spices", 20, "cubes", 6),
  P("Curry powder", "Spices", 50, "g", 15),
  P("Thyme", "Spices", 30, "g", 10),
  P("Yaji spice", "Spices", 50, "g", 15),
  // ---- Cameroonian ingredients (common local names) ----
  P("Groundnut (raw)", "Soup items", 500, "g", 150),
  P("Cocoyam leaves", "Vegetables", 200, "g", 60),
  P("Huckleberry (njama njama)", "Vegetables", 300, "g", 100),
  P("Nkui powder", "Soup items", 100, "g", 30),
  P("Country onions", "Spices", 30, "g", 10),
  P("Pepper soup spice", "Spices", 50, "g", 15),
  P("Goat meat", "Protein", 0, "g", 300),
  P("Garlic", "Fruits & Veg", 6, "pcs", 2),
  P("Plantain leaves", "Vegetables", 6, "pcs", 2),
];

/* ================= RECIPES (quantities are PER 1.0 ADULT PORTION) ================= */
let _rid = 1;
const I = (n, q, u) => ({ n, q, u });
const R = (name, origin, type, time, serveWith, ingredients, steps) => ({
  id: _rid++, name, origin, type, time, serveWith, ingredients, steps,
});

const RECIPES = [
  /* ---------- BREAKFASTS ---------- */
  R("Akara & Pap", "General", "breakfast", "45 min", null,
    [I("Beans", 100, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.25, "pcs"), I("Vegetable oil", 50, "ml"), I("Pap (ogi)", 70, "g"), I("Milk", 40, "ml"), I("Sugar", 15, "g"), I("Salt", 2, "g")],
    ["Soak beans for 15 minutes, then rub between your palms to peel off the skins and rinse clean.",
     "Blend the peeled beans with pepper and onion, adding only a little water so the batter stays thick.",
     "Whisk the batter vigorously for 2–3 minutes to add air, then season with salt.",
     "Heat vegetable oil and deep-fry spoonfuls of batter until golden brown on both sides. Drain.",
     "Mix pap with a little cold water into a smooth paste, then pour in boiling water while stirring until it thickens.",
     "Serve the hot pap with milk and sugar, with akara on the side."]),
  R("Fried Plantain & Egg Sauce", "General", "breakfast", "25 min", null,
    [I("Plantain", 1, "pcs"), I("Eggs", 1.5, "pcs"), I("Tomatoes", 1, "pcs"), I("Onions", 0.25, "pcs"), I("Fresh pepper", 0.25, "pcs"), I("Vegetable oil", 40, "ml"), I("Salt", 2, "g")],
    ["Peel and slice ripe plantains diagonally; sprinkle lightly with salt.",
     "Fry plantain slices in hot oil until golden on both sides; drain on paper.",
     "In a little of the same oil, sauté chopped onions, tomatoes and pepper for 3–4 minutes.",
     "Whisk the eggs with a pinch of salt and pour over the sauce.",
     "Stir gently until the eggs are just set. Serve with the fried plantain."]),
  R("Fluffy Pancakes", "General", "breakfast", "20 min", null,
    [I("Flour", 60, "g"), I("Eggs", 0.5, "pcs"), I("Milk", 60, "ml"), I("Sugar", 12, "g"), I("Butter", 10, "g"), I("Salt", 1, "g")],
    ["Whisk flour, sugar and salt in a bowl.",
     "Beat in the eggs and milk until you have a smooth, pourable batter.",
     "Melt a little butter in a pan on medium heat.",
     "Pour a ladle of batter, cook until bubbles form, flip and cook the other side.",
     "Repeat with remaining batter. Serve warm."]),
  R("Creamy Oatmeal", "General", "breakfast", "10 min", null,
    [I("Oats", 50, "g"), I("Milk", 100, "ml"), I("Sugar", 10, "g")],
    ["Bring water to a boil and stir in the oats.",
     "Simmer for 4–5 minutes, stirring, until soft and creamy.",
     "Stir in milk and sugar to taste and warm through.",
     "Serve hot; add sliced banana or groundnut if you like."]),
  R("Bread, Fried Egg & Tea", "General", "breakfast", "15 min", null,
    [I("Bread", 3, "slices"), I("Eggs", 1, "pcs"), I("Tea bags", 1, "pcs"), I("Milk", 30, "ml"), I("Sugar", 10, "g"), I("Vegetable oil", 10, "ml")],
    ["Boil water and steep the tea bags for 3 minutes; add milk and sugar.",
     "Whisk eggs with a pinch of salt (add chopped onion or pepper if you like).",
     "Fry the eggs in a lightly oiled pan until set.",
     "Serve the eggs with bread slices and the hot tea."]),
  R("Stir-fried Noodles & Veg", "General", "breakfast", "15 min", null,
    [I("Noodles", 1, "packs"), I("Eggs", 1, "pcs"), I("Carrot", 0.25, "pcs"), I("Green pepper", 0.25, "pcs"), I("Vegetable oil", 15, "ml")],
    ["Boil noodles for 3 minutes with the seasoning sachet; drain, keeping a little of the water.",
     "Stir-fry diced carrot and green pepper in hot oil for 2 minutes.",
     "Push veg aside, scramble the egg in the same pan.",
     "Toss in the noodles and stir-fry everything together for 2 minutes. Serve hot."]),
  R("Boiled Yam & Egg Sauce", "General", "breakfast", "30 min", null,
    [I("Yam", 250, "g"), I("Eggs", 1, "pcs"), I("Tomatoes", 1, "pcs"), I("Onions", 0.25, "pcs"), I("Fresh pepper", 0.25, "pcs"), I("Vegetable oil", 30, "ml"), I("Salt", 2, "g")],
    ["Peel, cube and rinse the yam; boil in salted water until fork-tender (about 15 minutes). Drain.",
     "Sauté chopped onions, tomatoes and pepper in oil for 4 minutes.",
     "Whisk eggs with salt and pour into the sauce.",
     "Stir gently until the eggs are set but soft.",
     "Serve the egg sauce over the hot boiled yam."]),

  /* ---------- IGBO MAINS ---------- */
  R("Ofe Egusi (Egusi Soup)", "Igbo", "main", "60 min", "eba, fufu or pounded yam",
    [I("Egusi (ground)", 60, "g"), I("Palm oil", 30, "ml"), I("Beef", 100, "g"), I("Stockfish", 30, "g"), I("Crayfish (ground)", 10, "g"), I("Ugu leaves", 50, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.25, "pcs"), I("Seasoning cubes", 1, "cubes"), I("Garri", 100, "g")],
    ["Season and boil the beef and stockfish with onion and seasoning until tender; keep the stock.",
     "Mix ground egusi with a little water into a thick paste.",
     "Heat palm oil, add the egusi paste in lumps and fry gently for 8–10 minutes, stirring so it doesn't burn.",
     "Add the meat stock gradually, then the meats, crayfish and blended pepper. Simmer 15 minutes.",
     "Stir in the sliced ugu leaves, adjust salt, and simmer 3 more minutes.",
     "Make eba: pour garri into hot water and turn until smooth. Serve with the soup."]),
  R("Ofe Onugbu (Bitterleaf Soup)", "Igbo", "main", "75 min", "fufu, garri or pounded yam",
    [I("Bitterleaf (washed)", 60, "g"), I("Cocoyam", 80, "g"), I("Palm oil", 25, "ml"), I("Beef", 100, "g"), I("Dried fish", 40, "g"), I("Crayfish (ground)", 10, "g"), I("Ogiri", 4, "g"), I("Seasoning cubes", 1, "cubes"), I("Garri", 100, "g")],
    ["Boil cocoyam until very soft, peel, and pound into a smooth paste (the thickener).",
     "Season and boil beef and dried fish until tender; keep the stock.",
     "Add washed bitterleaf to the pot of meat and stock and boil 10 minutes.",
     "Add cocoyam paste in small lumps, palm oil, crayfish, ogiri and seasoning.",
     "Simmer until the cocoyam dissolves and the soup thickens, about 15 minutes.",
     "Adjust salt and serve hot with your swallow of choice."]),
  R("Ofe Oha (Oha Soup)", "Igbo", "main", "70 min", "pounded yam or fufu",
    [I("Oha leaves", 40, "g"), I("Cocoyam", 80, "g"), I("Palm oil", 25, "ml"), I("Assorted meat", 120, "g"), I("Stockfish", 30, "g"), I("Crayfish (ground)", 10, "g"), I("Ogiri", 4, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Boil cocoyam until soft, peel and pound into a smooth paste.",
     "Season and cook assorted meat and stockfish until tender; keep the stock.",
     "Add palm oil, crayfish, ogiri and seasoning to the pot and simmer 10 minutes.",
     "Drop in the cocoyam paste in small lumps and let it dissolve to thicken the soup.",
     "Tear (never cut) the oha leaves with your fingers and add last.",
     "Simmer 3 minutes only, so the leaves stay tender. Serve hot."]),
  R("Ofe Nsala (White Soup)", "Igbo", "main", "55 min", "pounded yam",
    [I("Catfish", 180, "g"), I("Yam", 70, "g"), I("Utazi", 4, "g"), I("Uziza", 4, "g"), I("Fresh pepper", 0.5, "pcs"), I("Crayfish (ground)", 10, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Wash catfish with hot water to remove slime; cut into steaks.",
     "Boil a small piece of yam until soft and pound into a smooth paste.",
     "Poach the fish gently with seasoning, pepper and crayfish for 10 minutes.",
     "Add the yam paste in lumps to thicken — no palm oil; nsala is a white soup.",
     "Add sliced utazi and uziza leaves, simmer 5 minutes, and adjust salt.",
     "Serve hot with pounded yam."]),
  R("Ofe Akwu with Rice", "Igbo", "main", "60 min", "boiled white rice",
    [I("Palm fruit concentrate", 100, "g"), I("Rice", 110, "g"), I("Dried fish", 60, "g"), I("Beef", 80, "g"), I("Scent leaves", 5, "g"), I("Onions", 0.25, "pcs"), I("Crayfish (ground)", 8, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Dilute palm fruit concentrate with warm water and pour into a pot.",
     "Boil on high heat, uncovered, for 15 minutes to reduce slightly.",
     "Add cooked beef, dried fish, chopped onions, crayfish and seasoning.",
     "Simmer until the sauce thickens and oil rises to the top.",
     "Stir in sliced scent leaves and simmer 2 minutes.",
     "Boil the rice separately in salted water until tender; serve with the akwu sauce."]),
  R("Abacha (African Salad)", "Igbo", "main", "35 min", null,
    [I("Abacha (cassava shreds)", 100, "g"), I("Ugba", 30, "g"), I("Palm oil", 35, "ml"), I("Potash", 3, "g"), I("Crayfish (ground)", 8, "g"), I("Dried fish", 60, "g"), I("Garden eggs", 1.5, "pcs"), I("Utazi", 3, "g"), I("Onions", 0.25, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Soak abacha in warm water for 10 minutes until soft, then drain well.",
     "Dissolve potash in a little water and mix with palm oil until it turns thick and yellow (ncha).",
     "Stir in crayfish, ground pepper and seasoning to make the dressing.",
     "Toss in the abacha and ugba until every strand is coated.",
     "Fold in sliced onions, garden eggs, utazi and fish.",
     "Serve at room temperature, garnished with more fish and utazi."]),
  R("Ji Agworagwo (Yam Porridge)", "Igbo", "main", "45 min", null,
    [I("Yam", 300, "g"), I("Palm oil", 25, "ml"), I("Dried fish", 50, "g"), I("Crayfish (ground)", 8, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.25, "pcs"), I("Ugu leaves", 30, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Peel and cube the yam; rinse and put in a pot with water just covering it.",
     "Add palm oil, chopped onions, blended pepper, crayfish, dried fish and seasoning.",
     "Cook on medium heat until the yam is soft, about 20 minutes.",
     "Mash a few yam cubes against the pot to thicken the porridge.",
     "Stir in the ugu leaves, adjust salt, and simmer 3 minutes. Serve hot."]),
  R("Okpa (Bambara Pudding)", "Igbo", "main", "70 min", null,
    [I("Okpa flour", 120, "g"), I("Palm oil", 25, "ml"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.2, "pcs"), I("Salt", 2, "g")],
    ["Sift okpa flour into a bowl and mix with palm oil until evenly yellow.",
     "Gradually whisk in warm water until you have a smooth, pourable batter.",
     "Season with salt, blended pepper and chopped onions.",
     "Pour into wraps (banana leaves, foil or small bowls) and seal.",
     "Steam in boiling water for 45–50 minutes until firm.",
     "Unwrap and serve hot — a proud Enugu classic."]),
  R("Nkwobi (Spicy Cow Foot)", "Igbo", "main", "90 min", null,
    [I("Cow foot", 250, "g"), I("Palm oil", 30, "ml"), I("Potash", 4, "g"), I("Ehu seeds", 2, "g"), I("Utazi", 4, "g"), I("Onions", 0.5, "pcs"), I("Fresh pepper", 0.5, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Wash the cow foot, season, and cook until very tender (pressure cooking saves time).",
     "Toast and grind the ehu seeds; blend the pepper.",
     "Dissolve potash in water, then whisk into palm oil until it thickens and turns yellow.",
     "Stir in ehu, pepper and seasoning to make the sauce.",
     "Toss the hot cow foot pieces in the sauce until fully coated; warm through briefly.",
     "Serve in a wooden mortar topped with onion rings and utazi leaves."]),

  /* ---------- OTHER NIGERIAN TRIBES ---------- */
  R("Party Jollof Rice", "General", "main", "60 min", "fried plantain or salad",
    [I("Rice", 120, "g"), I("Tomatoes", 1.5, "pcs"), I("Tomato paste", 15, "g"), I("Tatashe", 0.5, "pcs"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.5, "pcs"), I("Vegetable oil", 30, "ml"), I("Chicken", 150, "g"), I("Curry powder", 2, "g"), I("Thyme", 1, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Season and cook the chicken; keep the stock, then fry or grill the chicken.",
     "Blend tomatoes, tatashe, pepper and half the onions; boil the blend down until thick.",
     "Fry sliced onions in oil, add tomato paste and fry 3 minutes, then add the blend.",
     "Season with curry, thyme, seasoning cubes and the chicken stock.",
     "Stir in washed rice, cover with foil then the lid, and cook on low heat until tender.",
     "Let it catch slightly at the bottom for that smoky party flavour. Serve with the chicken."]),
  R("Amala, Ewedu & Gbegiri", "Yoruba", "main", "70 min", null,
    [I("Yam flour (elubo)", 120, "g"), I("Ewedu leaves", 40, "g"), I("Beans", 50, "g"), I("Palm oil", 15, "ml"), I("Beef", 100, "g"), I("Locust beans (iru)", 4, "g"), I("Fresh pepper", 0.5, "pcs"), I("Crayfish (ground)", 5, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Gbegiri: boil peeled beans until very soft, mash smooth, add palm oil and seasoning; simmer.",
     "Ewedu: cook the leaves in a little water, blend or whisk with a broom, season with iru and crayfish.",
     "Cook seasoned beef in pepper stew; keep aside.",
     "Amala: sprinkle elubo into boiling water while stirring hard until smooth and stretchy.",
     "Steam the amala 2 minutes with a splash of water and turn again.",
     "Serve amala with gbegiri and ewedu poured together, topped with the beef."]),
  R("Efo Riro (Vegetable Stew)", "Yoruba", "main", "50 min", "eba, rice or amala",
    [I("Spinach", 120, "g"), I("Palm oil", 30, "ml"), I("Assorted meat", 120, "g"), I("Tatashe", 0.75, "pcs"), I("Fresh pepper", 0.5, "pcs"), I("Locust beans (iru)", 4, "g"), I("Crayfish (ground)", 8, "g"), I("Onions", 0.25, "pcs"), I("Seasoning cubes", 1, "cubes"), I("Garri", 100, "g")],
    ["Blend tatashe, pepper and onion coarsely; boil the blend until thick.",
     "Season and cook the assorted meat until tender.",
     "Heat palm oil, fry sliced onions and iru, then add the pepper blend and fry 10 minutes.",
     "Add the meats, crayfish and seasoning; simmer 5 minutes.",
     "Blanch the spinach, squeeze out water, and fold it into the stew.",
     "Simmer 3 minutes and serve with eba or rice."]),
  R("Tuwo Shinkafa & Miyan Kuka", "Hausa", "main", "60 min", null,
    [I("Rice", 120, "g"), I("Kuka powder", 12, "g"), I("Dried fish", 50, "g"), I("Beef", 80, "g"), I("Groundnut oil", 20, "ml"), I("Yaji spice", 3, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Cook soft rice with extra water, mashing as it cooks until it forms a smooth mould (tuwo).",
     "Shape the tuwo into balls with a wet bowl and keep warm.",
     "Cook seasoned beef and dried fish in stock with groundnut oil.",
     "Whisk kuka (baobab leaf) powder into the simmering stock until smooth — no lumps.",
     "Season with yaji and seasoning cubes; simmer 10 minutes.",
     "Serve the miyan kuka over the tuwo shinkafa."]),
  R("Edikang Ikong", "Efik / Ibibio", "main", "60 min", "pounded yam, fufu or garri",
    [I("Ugu leaves", 80, "g"), I("Waterleaf", 80, "g"), I("Palm oil", 30, "ml"), I("Assorted meat", 120, "g"), I("Periwinkle", 40, "g"), I("Crayfish (ground)", 10, "g"), I("Dried fish", 40, "g"), I("Fresh pepper", 0.5, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Season and cook assorted meat and dried fish with very little water until tender.",
     "Add periwinkle, palm oil, crayfish, pepper and seasoning; simmer 5 minutes.",
     "Add sliced waterleaf first and cook 3 minutes — it releases its own water.",
     "Fold in the sliced ugu leaves.",
     "Simmer uncovered 5 minutes; the soup should be rich, not watery.",
     "Adjust salt and serve with your swallow of choice."]),
  R("Moi Moi (Steamed Bean Pudding)", "General", "main", "75 min", "pap, custard or rice",
    [I("Beans", 130, "g"), I("Tatashe", 0.5, "pcs"), I("Fresh pepper", 0.3, "pcs"), I("Onions", 0.3, "pcs"), I("Vegetable oil", 25, "ml"), I("Eggs", 0.5, "pcs"), I("Dried fish", 30, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Soak and peel the beans, then blend very smooth with tatashe, pepper and onions.",
     "Whisk in oil, seasoning and warm water until the batter is light and pourable.",
     "Fold in flaked fish; boil the eggs, slice, and set aside.",
     "Pour batter into leaves, foil or ramekins, tucking egg slices inside.",
     "Steam over boiling water for 45–55 minutes until firm.",
     "Rest 5 minutes before unwrapping. Serve warm."]),
  R("Nigerian Fried Rice", "General", "main", "55 min", "chicken and coleslaw",
    [I("Rice", 120, "g"), I("Carrot", 0.5, "pcs"), I("Green beans", 30, "g"), I("Sweet corn", 20, "g"), I("Liver", 50, "g"), I("Chicken", 150, "g"), I("Vegetable oil", 25, "ml"), I("Curry powder", 3, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Cook the chicken with seasoning; keep the stock and fry the chicken.",
     "Parboil rice in the stock with curry powder until nearly done; drain and spread to cool.",
     "Boil and dice the liver; dice carrots and green beans.",
     "Stir-fry the vegetables and liver in hot oil for 3 minutes.",
     "Add the rice in batches, tossing on high heat until well mixed and fragrant.",
     "Adjust seasoning and serve with the fried chicken."]),
  R("White Rice & Chicken Stew", "General", "main", "60 min", "fried plantain",
    [I("Rice", 120, "g"), I("Tomatoes", 1.5, "pcs"), I("Tomato paste", 15, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.5, "pcs"), I("Vegetable oil", 40, "ml"), I("Chicken", 150, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Blend tomatoes, pepper and half the onions; boil the blend until thick.",
     "Season and cook the chicken; keep the stock, then fry the chicken pieces.",
     "Fry sliced onions in oil, add tomato paste, then the blend; fry 15 minutes until the oil floats.",
     "Add chicken stock, the chicken and seasoning; simmer 10 minutes.",
     "Boil the rice in salted water until fluffy; drain.",
     "Serve the stew over the rice."]),

  /* ---------- CAMEROON (NW & SW REGIONS) ---------- */
  R("Eru with Waterfufu", "Cameroon (SW)", "main", "70 min", "waterfufu or garri",
    [I("Eru (okazi) leaves", 60, "g"), I("Waterleaf", 70, "g"), I("Palm oil", 35, "ml"), I("Dried fish", 40, "g"), I("Assorted meat", 80, "g"), I("Crayfish (ground)", 8, "g"), I("Fresh pepper", 0.5, "pcs"), I("Seasoning cubes", 1, "cubes"), I("Garri", 100, "g")],
    ["Boil the kanda/assorted meat with seasoning until very tender; keep a little stock.",
     "Shred the eru (okazi) leaves as finely as possible.",
     "Add sliced waterleaf to the pot and let it melt down for 5 minutes — it provides the moisture.",
     "Stir in the eru, dried fish, crayfish and pepper.",
     "Pour in a generous amount of palm oil, season with salt, and simmer 10–12 minutes, stirring.",
     "Serve hot with waterfufu or garri — the pride of the Southwest."]),
  R("Kati Kati with Corn Fufu", "Cameroon (NW)", "main", "75 min", "corn fufu and njama njama",
    [I("Chicken", 220, "g"), I("Palm oil", 40, "ml"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.25, "pcs"), I("Corn flour", 120, "g"), I("Spinach", 60, "g"), I("Salt", 2, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Cut the chicken into pieces, season, and roast or grill until lightly charred (the Kom way).",
     "Simmer the roasted chicken in palm oil, pepper, onions and a splash of water for 15 minutes until the sauce clings.",
     "Corn fufu: sprinkle corn flour into boiling water, stirring hard until stiff and smooth; steam briefly.",
     "Sauté the greens (njama njama or spinach) with onions and a little oil.",
     "Mould the corn fufu and serve with the kati kati and greens."]),
  R("Corn Chaff", "Cameroon (NW)", "main", "80 min", null,
    [I("Dried corn", 100, "g"), I("Beans", 80, "g"), I("Palm oil", 30, "ml"), I("Tomatoes", 1, "pcs"), I("Onions", 0.25, "pcs"), I("Fresh pepper", 0.5, "pcs"), I("Dried fish", 30, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Soak the dried corn and beans (overnight if possible) to soften.",
     "Boil the corn for about 40 minutes, then add the beans and cook until both are soft.",
     "In another pot, sauté chopped tomatoes, onions and pepper in palm oil.",
     "Combine the sauce with the corn and beans; add dried fish and seasoning.",
     "Simmer gently until slightly thick and the flavours marry, about 15 minutes.",
     "Rest 5 minutes and serve warm — perfect batch food for days."]),
  R("Achu & Yellow Soup", "Cameroon (NW)", "main", "90 min", null,
    [I("Cocoyam", 300, "g"), I("Palm oil", 45, "ml"), I("Potash", 4, "g"), I("Achu spice", 5, "g"), I("Beef", 120, "g"), I("Dried fish", 30, "g"), I("Salt", 2, "g")],
    ["Boil the cocoyams until soft, peel, and pound until smooth and stretchy (the achu).",
     "Cook the beef and dried fish with salt until tender.",
     "Dissolve the potash (kanwa) in warm water and strain.",
     "Whisk palm oil while adding the potash water little by little until it emulsifies and turns bright yellow.",
     "Season the yellow soup with achu spice and salt, then add the meats.",
     "Mould the achu on a plate, make a well in the centre, and pour in the yellow soup."]),
  R("Ndolé", "Cameroon (SW)", "main", "85 min", "miondo, bobolo or white rice",
    [I("Bitterleaf (washed)", 70, "g"), I("Groundnut (raw)", 90, "g"), I("Beef", 100, "g"), I("Dried fish", 40, "g"), I("Crayfish (ground)", 10, "g"), I("Palm oil", 30, "ml"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.3, "pcs"), I("Garlic", 0.5, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Wash the bitterleaf repeatedly to remove the bitterness, or use ready-washed leaves.",
     "Boil the raw groundnuts until soft, then blend into a smooth paste.",
     "Season and boil the beef with onion and seasoning until tender; keep the stock.",
     "Add the groundnut paste to the stock and simmer, stirring, until it thickens and the oil rises.",
     "Stir in the bitterleaf, dried fish, crayfish and pepper; simmer 15 minutes.",
     "Fry a little onion and garlic in oil and stir into the pot. Serve with miondo, bobolo or rice."]),
  R("Ekwang", "Cameroon (SW)", "main", "120 min", null,
    [I("Cocoyam", 300, "g"), I("Cocoyam leaves", 80, "g"), I("Palm oil", 40, "ml"), I("Dried fish", 40, "g"), I("Assorted meat", 80, "g"), I("Crayfish (ground)", 10, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.3, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Peel and grate the raw cocoyam into a smooth paste; season lightly.",
     "Wrap small spoonfuls of the cocoyam paste inside tender cocoyam leaves into little parcels.",
     "Line a pot and arrange the wraps; add water, dried fish, meat, crayfish and pepper.",
     "Cook gently for about an hour, adding palm oil and seasoning midway, until soft and rich.",
     "Shake the pot (don't stir) so the wraps stay whole; serve hot in its red oil sauce."]),
  R("Njama Njama & Corn Fufu", "Cameroon (NW)", "main", "50 min", "corn fufu",
    [I("Huckleberry (njama njama)", 120, "g"), I("Corn flour", 120, "g"), I("Palm oil", 25, "ml"), I("Onions", 0.3, "pcs"), I("Fresh pepper", 0.3, "pcs"), I("Dried fish", 30, "g"), I("Salt", 2, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Parboil the huckleberry (njama njama) leaves briefly, then drain to reduce bitterness.",
     "Heat palm oil, fry sliced onions and pepper, then add the leaves.",
     "Add dried fish and seasoning; simmer 10 minutes until well combined.",
     "Corn fufu: rain corn flour into boiling water, stirring hard until stiff and smooth; steam briefly.",
     "Mould the fufu and serve with the njama njama — the everyday pride of the Northwest."]),
  R("Nkui", "Cameroon (NW)", "main", "60 min", "fufu corn or water fufu",
    [I("Nkui powder", 20, "g"), I("Assorted meat", 120, "g"), I("Dried fish", 40, "g"), I("Crayfish (ground)", 10, "g"), I("Palm oil", 25, "ml"), I("Fresh pepper", 0.4, "pcs"), I("Onions", 0.3, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Season and boil the assorted meat and dried fish until tender; keep the stock.",
     "Whisk the nkui powder into warm stock until it turns into a smooth, drawy (slippery) soup.",
     "Add crayfish, pepper, onion and palm oil; season to taste.",
     "Simmer gently, stirring, until the soup draws and thickens.",
     "Serve the slippery nkui with fufu corn — a Northwest celebration dish."]),
  R("Mbanga Soup (Banga)", "Cameroon (SW)", "main", "80 min", "water fufu or miondo",
    [I("Palm fruit concentrate", 120, "g"), I("Catfish", 120, "g"), I("Dried fish", 30, "g"), I("Crayfish (ground)", 10, "g"), I("Fresh pepper", 0.5, "pcs"), I("Onions", 0.3, "pcs"), I("Country onions", 3, "g"), I("Seasoning cubes", 1, "cubes")],
    ["Simmer the palm fruit concentrate with a little water to form the banga base.",
     "Season and add the catfish and dried fish; cook gently so the fish stays whole.",
     "Add crayfish, pepper, onion and ground country-onion spice.",
     "Simmer 20–25 minutes until the soup is thick and glossy with red oil on top.",
     "Serve hot with water fufu or miondo."]),
  R("Kwacoco Bible", "Cameroon (SW)", "main", "110 min", null,
    [I("Cocoyam", 300, "g"), I("Palm oil", 45, "ml"), I("Dried fish", 40, "g"), I("Crayfish (ground)", 10, "g"), I("Fresh pepper", 0.4, "pcs"), I("Plantain leaves", 2, "pcs"), I("Onions", 0.3, "pcs"), I("Seasoning cubes", 1, "cubes")],
    ["Grate the raw cocoyam into a soft paste and season with crayfish, pepper and seasoning.",
     "Work in the red palm oil until the paste turns a rich orange.",
     "Wrap the paste in plantain leaves into a large parcel (the 'bible').",
     "Steam the parcel for about 1.5 hours until firm and cooked through.",
     "Slice and serve with banga soup or pepper soup — a coastal Southwest favourite."]),
  R("Pepper Soup (Nkang)", "Cameroon (SW)", "main", "45 min", "plain rice or alone",
    [I("Goat meat", 150, "g"), I("Pepper soup spice", 6, "g"), I("Fresh pepper", 0.6, "pcs"), I("Onions", 0.3, "pcs"), I("Country onions", 3, "g"), I("Scent leaves", 6, "g"), I("Seasoning cubes", 1, "cubes"), I("Salt", 2, "g")],
    ["Wash and season the goat meat; boil with onion until nearly tender.",
     "Add the pepper soup spice, ground country onion and fresh pepper.",
     "Simmer until the meat is soft and the broth is fragrant and light.",
     "Stir in torn scent leaves at the end and adjust salt.",
     "Serve piping hot as a peppery broth — great for cold evenings and recovery."]),
];

/* Shelf life & freezer flags: [days a pot lasts, freezer-friendly] */
const MEAL_META = {
  "Ofe Egusi (Egusi Soup)": [3, true], "Ofe Onugbu (Bitterleaf Soup)": [3, true],
  "Ofe Oha (Oha Soup)": [3, true], "Ofe Nsala (White Soup)": [2, true],
  "Ofe Akwu with Rice": [2, true], "Abacha (African Salad)": [1, false],
  "Ji Agworagwo (Yam Porridge)": [2, false], "Okpa (Bambara Pudding)": [2, true],
  "Nkwobi (Spicy Cow Foot)": [2, false], "Party Jollof Rice": [2, true],
  "Amala, Ewedu & Gbegiri": [2, true], "Efo Riro (Vegetable Stew)": [3, true],
  "Tuwo Shinkafa & Miyan Kuka": [2, true], "Edikang Ikong": [2, false],
  "Moi Moi (Steamed Bean Pudding)": [2, true], "Nigerian Fried Rice": [2, true],
  "White Rice & Chicken Stew": [2, true], "Eru with Waterfufu": [3, true],
  "Kati Kati with Corn Fufu": [2, true], "Corn Chaff": [3, true],
  "Achu & Yellow Soup": [2, false],
  "Ndolé": [3, true], "Ekwang": [2, false], "Njama Njama & Corn Fufu": [2, false],
  "Nkui": [2, true], "Mbanga Soup (Banga)": [3, true], "Kwacoco Bible": [2, true],
  "Pepper Soup (Nkang)": [2, false],
};
RECIPES.forEach((r) => {
  const m = MEAL_META[r.name] || [1, false];
  r.lasts = m[0];
  r.freeze = m[1];
});

/* ================= HELPERS ================= */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function fmtQty(q, u) {
  if (["pcs", "packs", "slices", "cubes"].includes(u)) {
    const v = Math.round(q * 2) / 2;
    return `${v % 1 === 0 ? v : v.toFixed(1)} ${u}`;
  }
  if (u === "g" && q >= 1000) return `${(q / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`;
  if (u === "ml" && q >= 1000) return `${(q / 1000).toFixed(2).replace(/\.?0+$/, "")} L`;
  const v = q < 10 ? Math.round(q * 10) / 10 : Math.round(q / 5) * 5;
  return `${v} ${u}`;
}

function matchPantry(pantry, ingName) {
  const a = ingName.toLowerCase();
  return pantry.find((p) => {
    const b = p.name.toLowerCase();
    return b === a || b.includes(a) || a.includes(b.split(" (")[0]);
  });
}

function availabilityScore(recipe, pantry, portions) {
  let have = 0;
  recipe.ingredients.forEach((ing) => {
    const item = matchPantry(pantry, ing.n);
    if (item && item.qty >= ing.q * portions * 0.9) have++;
  });
  return have / recipe.ingredients.length;
}

// Which cuisine does a recipe belong to?
function cuisineOf(r) {
  return r.origin.startsWith("Cameroon") ? "Cameroon" : "Nigeria";
}

// Filter the recipe pool to the chosen cuisine ("Nigeria" | "Cameroon" | "Both").
function poolForCuisine(type, cuisine) {
  return RECIPES.filter((r) => {
    if (r.type !== type) return false;
    if (cuisine === "Both") return true;
    return cuisineOf(r) === cuisine;
  });
}

/*
 * Smarter weekly plan.
 *  - cuisine: "Nigeria" | "Cameroon" | "Both" — limits which dishes appear.
 *  - cookAhead: how many days one fresh pot should feed (1 = cook every meal,
 *    2 or 3 = cook once, then carry over / freeze for the next day(s)).
 *  - Never repeats the same MAIN on consecutive days unless it is an intended
 *    carryover from the pot you just cooked.
 *  - Rotates proteins/dishes so the week feels varied and professional.
 */
function generatePlan(mealsPerDay, cookSessions, repeatIds, pantry, portions, cuisine = "Both", cookAhead = 1) {
  const mealNames = mealsPerDay === 1 ? ["Dinner"] : mealsPerDay === 2 ? ["Lunch", "Dinner"] : ["Breakfast", "Lunch", "Dinner"];
  const slots = [];
  DAYS.forEach((day) => mealNames.forEach((meal) => slots.push({ day, meal })));

  const usedMains = new Set();     // mains already cooked this week (avoid duplicates)
  const usedBreakfast = new Set();
  let lastMainId = null;           // the id of the most recently cooked main
  let potLeft = 0;                 // how many more days the current pot can serve
  let potInfo = null;              // { id, cookDayIdx, lasts, freeze }
  let prevDayMainId = null;        // main served on the previous day (block consecutives)
  let curDayIdx = -1;
  let curDayMainId = null;

  const pickMain = (dayIdx) => {
    let pool = poolForCuisine("main", cuisine);
    if (pool.length === 0) pool = RECIPES.filter((r) => r.type === "main"); // safety
    // Prefer dishes not yet used this week, and never the same as yesterday's main.
    let cand = pool.filter((r) => !usedMains.has(r.id) && r.id !== prevDayMainId);
    if (cand.length === 0) cand = pool.filter((r) => r.id !== prevDayMainId);
    if (cand.length === 0) cand = pool;
    // Rank by what the Food Store can already cook, plus randomness for variety.
    cand = cand
      .map((r) => ({ r, s: availabilityScore(r, pantry, portions) + Math.random() * 0.5 }))
      .sort((a, b) => b.s - a.s);
    return cand[0].r;
  };

  const result = slots.map((slot, i) => {
    const dayIdx = Math.floor(i / mealsPerDay);
    if (dayIdx !== curDayIdx) {
      // New day: yesterday's cooked main becomes "prevDay" to block back-to-back repeats.
      if (curDayMainId) prevDayMainId = curDayMainId;
      curDayIdx = dayIdx;
      curDayMainId = null;
    }
    const isBreakfast = slot.meal === "Breakfast";

    if (isBreakfast) {
      // Breakfasts: light rotation, may repeat later in the week but not day-to-day.
      let pool = poolForCuisine("breakfast", cuisine);
      if (pool.length === 0) pool = RECIPES.filter((r) => r.type === "breakfast");
      let cand = pool.filter((r) => !usedBreakfast.has(r.id));
      if (cand.length === 0) { usedBreakfast.clear(); cand = pool; }
      cand = cand.map((r) => ({ r, s: availabilityScore(r, pantry, portions) + Math.random() * 0.5 })).sort((a, b) => b.s - a.s);
      const pick = cand[0].r;
      usedBreakfast.add(pick.id);
      return { ...slot, recipeId: pick.id, cook: true, tag: "fresh" };
    }

    // MAIN meals: use carryover pot if one is still good, else cook fresh.
    if (potLeft > 0 && potInfo) {
      potLeft -= 1;
      const daysIn = dayIdx - potInfo.cookDayIdx + 1;
      const withinShelf = daysIn <= (potInfo.lasts || 1);
      const tag = withinShelf ? "leftover" : (potInfo.freeze ? "freezer" : "leftover");
      curDayMainId = potInfo.id;
      return { ...slot, recipeId: potInfo.id, cook: false, tag, potDay: daysIn, potLasts: potInfo.lasts, fromFreezer: !withinShelf && potInfo.freeze };
    }

    // Cook a fresh main.
    const pick = pickMain(dayIdx);
    usedMains.add(pick.id);
    lastMainId = pick.id;
    curDayMainId = pick.id;
    // Set up the pot: how many future MAIN slots it will cover.
    const span = Math.max(1, Math.min(cookAhead, pick.lasts && pick.freeze ? cookAhead : (pick.lasts || 1)));
    potInfo = { id: pick.id, cookDayIdx: dayIdx, lasts: pick.lasts || 1, freeze: !!pick.freeze };
    potLeft = span - 1; // this slot is day 1; remaining days are carryover
    return { ...slot, recipeId: pick.id, cook: true, tag: "fresh", cookAhead: span };
  });

  return result;
}

/* ================= SMALL UI PIECES ================= */
const card = { background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, boxShadow: "0 2px 10px rgba(216,27,96,0.07)" };
const btnRose = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const btnSoft = { background: C.soft, color: C.deep, border: `1.5px solid ${C.border}`, borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const inputStyle = { border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", background: "#FFF9FB", color: C.brown, outline: "none", fontFamily: "inherit" };

function Badge({ children, color = C.rose, bg = C.soft }) {
  return (
    <span style={{ background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SectionTitle({ icon, children, sub }) {
  return (
    <div className="mb-4">
      <h2 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 24, fontWeight: 600 }}>
        {icon} {children}
      </h2>
      {sub && <p style={{ color: C.brownSoft, fontSize: 14, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function KitchenApp({ profile, session, onLogout, onUpgrade, cloudSave, cloudLoad }) {
  const isGuest = profile.plan !== "full";
  const [tab, setTab] = useState("dashboard");
  const [family, setFamily] = useState([
    { id: 1, name: "Papa", age: 38 },
    { id: 2, name: "Mama", age: 34 },
    { id: 3, name: "Adaeze", age: 9 },
    { id: 4, name: "Obi", age: 4 },
  ]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [cookSessions, setCookSessions] = useState(21);
  const [repeatIds, setRepeatIds] = useState([]);
  const [pantry, setPantry] = useState(SEED_PANTRY);
  const [plan, setPlan] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [newMember, setNewMember] = useState({ name: "", age: "" });
  const [newItem, setNewItem] = useState({ name: "", qty: "", unit: "g", cat: "Grains" });
  const [pantrySearch, setPantrySearch] = useState("");
  const [recipeFilter, setRecipeFilter] = useState("All");
  const [cuisine, setCuisine] = useState("Both");   // Nigeria | Cameroon | Both
  const [cookAhead, setCookAhead] = useState(1);      // 1 = cook each meal; 2/3 = cook once, eat 2/3 days
  const [showNotif, setShowNotif] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const portions = useMemo(() => family.reduce((s, m) => s + portionFactor(m.age), 0), [family]);
  const totalSlots = mealsPerDay * 7;
  const effCook = Math.min(cookSessions, totalSlots);
  // Low stock = items the user actually keeps (has added stock to at least once)
  // that have now run low. Brand-new empty-store items aren't flagged until used.
  const lowStock = pantry.filter((p) => p.tracked && p.qty <= p.low);

  /* ---- cloud sync ---- */
  useEffect(() => {
    (async () => {
      const d = await cloudLoad();
      if (d) {
        d.family && setFamily(d.family);
        d.pantry && setPantry(d.pantry);
        d.mealsPerDay && setMealsPerDay(d.mealsPerDay);
        d.cookSessions && setCookSessions(d.cookSessions);
        d.repeatIds && setRepeatIds(d.repeatIds);
        d.cuisine && setCuisine(d.cuisine);
        d.cookAhead && setCookAhead(d.cookAhead);
        d.plan && setPlan(d.plan);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Welcome message once per login/session ---- */
  useEffect(() => {
    try {
      const key = "mk_welcomed_" + (session?.user?.id || "guest");
      if (!sessionStorage.getItem(key)) {
        setShowWelcome(true);
        sessionStorage.setItem(key, "1");
      }
    } catch { /* sessionStorage may be unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Notifications: next meal + low stock ---- */
  const notifications = useMemo(() => {
    const list = [];
    // Next upcoming meal from the plan (first cook-fresh slot).
    if (plan) {
      const next = plan.find((s) => s.cook && s.recipeId);
      if (next) {
        const r = RECIPES.find((x) => x.id === next.recipeId);
        if (r) list.push({ icon: "🍲", kind: "meal", text: `Next to cook: ${r.name} — ${next.day} ${next.meal.toLowerCase()}` });
      }
      const freezerMeals = plan.filter((s) => s.fromFreezer).length;
      if (freezerMeals > 0) list.push({ icon: "❄️", kind: "meal", text: `${freezerMeals} meal(s) this week come from the freezer — remember to defrost ahead.` });
    }
    // Low stock items.
    lowStock.forEach((p) => {
      list.push({ icon: "⚠️", kind: "stock", text: `Low on ${p.name} — ${p.qty <= 0 ? "you're out" : fmtQty(p.qty, p.unit) + " left"}.` });
    });
    if (list.length === 0) list.push({ icon: "✅", kind: "ok", text: "All good! No meal or stock alerts right now." });
    return list;
  }, [plan, lowStock]);

  const alertCount = notifications.filter((n) => n.kind !== "ok").length;

  const saveCloud = async () => {
    if (isGuest) { showToast("⭐ Cloud sync is a full-access feature — upgrade to keep your kitchen everywhere"); return; }
    const res = await cloudSave({ family, pantry, mealsPerDay, cookSessions, repeatIds, cuisine, cookAhead, plan });
    showToast(res && res.error ? "Cloud save failed: " + res.error.message : "Kitchen saved to the cloud ☁️");
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const cookRecipe = (recipe) => {
    if (isGuest) { showToast("🔒 Cooking with Food Store deduction is for full members — upgrade to unlock"); return; }
    setPantry((prev) => {
      const next = prev.map((p) => ({ ...p }));
      recipe.ingredients.forEach((ing) => {
        const item = next.find((p) => {
          const a = ing.n.toLowerCase(); const b = p.name.toLowerCase();
          return b === a || b.includes(a) || a.includes(b.split(" (")[0]);
        });
        if (item && item.unit === ing.u) item.qty = Math.max(0, Math.round((item.qty - ing.q * portions) * 100) / 100);
      });
      return next;
    });
    showToast(
      recipe.freeze
        ? `Cooked ${recipe.name} for ${portions.toFixed(2)} portions — Food Store updated 🍲 Tip: freeze the extra ❄️`
        : `Cooked ${recipe.name} for ${portions.toFixed(2)} portions — Food Store updated 🍲`
    );
  };

  const missingForPlan = useMemo(() => {
    if (!plan) return [];
    const need = {};
    plan.filter((s) => s.cook && s.recipeId).forEach((s) => {
      const r = RECIPES.find((x) => x.id === s.recipeId);
      r.ingredients.forEach((ing) => {
        const key = ing.n + "|" + ing.u;
        need[key] = (need[key] || 0) + ing.q * portions;
      });
    });
    const out = [];
    Object.entries(need).forEach(([key, qty]) => {
      const [name, unit] = key.split("|");
      const item = matchPantry(pantry, name);
      const have = item && item.unit === unit ? item.qty : 0;
      if (have < qty) out.push({ name, unit, short: qty - have });
    });
    return out.sort((a, b) => b.short - a.short);
  }, [plan, pantry, portions]);

  const TabBtn = ({ id, icon, label }) => (
    <button onClick={() => setTab(id)}
      className="px-4 py-2 transition-all"
      style={{
        ...(tab === id ? { background: C.rose, color: "#fff" } : { background: "rgba(255,255,255,0.85)", color: C.deep }),
        border: `1.5px solid ${tab === id ? C.rose : C.border}`, borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: "pointer",
      }}>
      {icon} {label}
    </button>
  );

  /* ---------- RENDER ---------- */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, backgroundImage: PATTERN, fontFamily: "'Nunito', sans-serif", color: C.brown }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;600;700;800&display=swap');
        input[type=range]{accent-color:${C.rose};}
        ::placeholder{color:#C79AAB;}`}</style>

      {/* Header */}
      <header className="px-4 pt-6 pb-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.svg" alt="My Kitchen logo" style={{ width: 52, height: 52, borderRadius: 14 }} />
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 40, fontWeight: 600, color: C.deep, lineHeight: 1.05 }}>
            {APP_NAME}
          </span>
        </div>
        <div style={{ color: C.brownSoft, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
          Your African kitchen companion — food store, recipes & weekly cooking plans
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
          <Badge color={C.deep} bg={C.softer}>👤 {profile.full_name || session.user.email || "Guest"}</Badge>
          {isGuest
            ? <Badge color="#B26A00" bg="#FFF3E0">👀 Guest trial</Badge>
            : <Badge color={C.green} bg="#E8F5E9">⭐ Full access{profile.plan_expires_at ? " until " + new Date(profile.plan_expires_at).toLocaleDateString() : ""}</Badge>}
          {isGuest && (
            <button style={{ ...btnRose, padding: "4px 14px", fontSize: 13 }} onClick={onUpgrade}>⭐ Buy full access — $20 first, then $5/mo</button>
          )}
          {!isGuest && (
            <button style={{ ...btnSoft, padding: "4px 14px", fontSize: 13 }} onClick={saveCloud}>☁️ Save to cloud</button>
          )}
          <button style={{ ...btnSoft, padding: "4px 14px", fontSize: 13, position: "relative" }} onClick={() => setShowNotif(true)}>
            🔔 Alerts
            {alertCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: C.rose, color: "#fff", borderRadius: 999, minWidth: 18, height: 18, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {alertCount}
              </span>
            )}
          </button>
          <button style={{ ...btnSoft, padding: "4px 14px", fontSize: 13 }} onClick={onLogout}>Log out</button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <TabBtn id="dashboard" icon="🏠" label="Dashboard" />
          <TabBtn id="pantry" icon="🥘" label="Food Store" />
          <TabBtn id="family" icon="👨‍👩‍👧‍👦" label="Family" />
          <TabBtn id="recipes" icon="📖" label="Recipes" />
          <TabBtn id="plan" icon="🗓️" label="Weekly Plan" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {/* ============ DASHBOARD ============ */}
        {tab === "dashboard" && (
          <div>
            <SectionTitle icon="🌸" sub="A quick look at your kitchen today.">Nnọọ! Welcome back</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Family portions", value: portions.toFixed(2), icon: "👨‍👩‍👧‍👦" },
                { label: "Store items", value: pantry.filter((p) => p.qty > 0).length, icon: "🥘" },
                { label: "Low stock", value: lowStock.length, icon: "⚠️" },
                { label: "Meals planned", value: plan ? plan.length : 0, icon: "🗓️" },
              ].map((s, i) => (
                <div key={i} className="p-4 text-center" style={card}>
                  <div style={{ fontSize: 26 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, color: C.rose, fontWeight: 600 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.brownSoft, fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5" style={card}>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 18, fontWeight: 600 }}>⚠️ Running low</h3>
                <p style={{ fontSize: 13, color: C.brownSoft, marginBottom: 10 }}>Restock these soon.</p>
                {lowStock.length === 0 && <p style={{ color: C.green, fontWeight: 700 }}>Everything is well stocked! 🎉</p>}
                <div className="flex flex-col gap-2">
                  {lowStock.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex justify-between items-center" style={{ background: C.soft, borderRadius: 12, padding: "8px 12px" }}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <Badge color={C.amber} bg="#FFF3E0">{fmtQty(p.qty, p.unit)} left</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5" style={card}>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 18, fontWeight: 600 }}>🛒 Shopping list for this week's plan</h3>
                {!plan && <p style={{ fontSize: 13, color: C.brownSoft, marginTop: 8 }}>Generate a weekly plan first, and anything your Food Store can't cover will appear here.</p>}
                {plan && missingForPlan.length === 0 && <p style={{ color: C.green, fontWeight: 700, marginTop: 8 }}>Your Food Store covers the whole week! 💪</p>}
                <div className="flex flex-col gap-2 mt-2">
                  {missingForPlan.slice(0, 10).map((m, i) => (
                    <div key={i} className="flex justify-between items-center" style={{ background: C.soft, borderRadius: 12, padding: "8px 12px" }}>
                      <span style={{ fontWeight: 700 }}>{m.name}</span>
                      <Badge>buy {fmtQty(m.short, m.unit)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ PANTRY ============ */}
        {tab === "pantry" && (
          <div>
            <SectionTitle icon="🧺" sub="What's in your kitchen right now. Cooking a meal deducts from your Food Store automatically.">Food Store</SectionTitle>
            <div className="p-4 mb-4 flex flex-wrap gap-2 items-end" style={card}>
              <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Item name</label>
                <input style={inputStyle} placeholder="e.g. Snail" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} /></div>
              <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Quantity</label>
                <input style={{ ...inputStyle, width: 90 }} type="number" placeholder="500" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })} /></div>
              <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Unit</label>
                <select style={inputStyle} value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                  {["g", "ml", "pcs", "packs", "slices", "cubes"].map((u) => <option key={u}>{u}</option>)}
                </select></div>
              <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Category</label>
                <select style={inputStyle} value={newItem.cat} onChange={(e) => setNewItem({ ...newItem, cat: e.target.value })}>
                  {["Grains", "Tubers", "Protein", "Vegetables", "Fruits & Veg", "Soup items", "Oils", "Spices", "Dairy & Drinks"].map((c) => <option key={c}>{c}</option>)}
                </select></div>
              <button style={{ ...btnRose, padding: "9px 20px" }} onClick={() => {
                if (!newItem.name || !newItem.qty) return;
                setPantry((p) => [...p, { id: Date.now(), name: newItem.name, cat: newItem.cat, qty: parseFloat(newItem.qty), unit: newItem.unit, low: Math.max(1, Math.round(parseFloat(newItem.qty) * 0.2)), tracked: true }]);
                setNewItem({ name: "", qty: "", unit: "g", cat: "Grains" });
                showToast("Item added to your Food Store 🧺");
              }}>+ Add item</button>
              <input style={{ ...inputStyle, marginLeft: "auto", minWidth: 160 }} placeholder="🔍 Search Food Store…" value={pantrySearch} onChange={(e) => setPantrySearch(e.target.value)} />
            </div>

            {["Grains", "Tubers", "Protein", "Vegetables", "Fruits & Veg", "Soup items", "Oils", "Spices", "Dairy & Drinks"].map((cat) => {
              const items = pantry.filter((p) => p.cat === cat && p.name.toLowerCase().includes(pantrySearch.toLowerCase()));
              if (items.length === 0) return null;
              return (
                <div key={cat} className="mb-4">
                  <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontWeight: 600, marginBottom: 8 }}>{cat}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3" style={{ ...card, borderRadius: 14, borderColor: p.qty <= p.low ? "#FFCC80" : C.border }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: p.qty <= p.low ? C.amber : C.brownSoft, fontWeight: 700 }}>
                            {fmtQty(p.qty, p.unit)} {p.qty <= p.low && "· low!"}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button style={{ ...btnSoft, padding: "2px 10px" }} onClick={() => setPantry((prev) => prev.map((x) => x.id === p.id ? { ...x, qty: Math.max(0, x.qty - (x.unit === "g" || x.unit === "ml" ? 100 : 1)) } : x))}>−</button>
                          <button style={{ ...btnSoft, padding: "2px 10px" }} onClick={() => setPantry((prev) => prev.map((x) => x.id === p.id ? { ...x, qty: x.qty + (x.unit === "g" || x.unit === "ml" ? 100 : 1), tracked: true } : x))}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ FAMILY ============ */}
        {tab === "family" && (
          <div>
            <SectionTitle icon="👨‍👩‍👧‍👦" sub="Age matters: each person counts as a fraction of an adult portion, so recipes scale accurately.">Family & Meal Settings</SectionTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5" style={card}>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontWeight: 600, fontSize: 18 }}>Family members</h3>
                <div className="flex flex-col gap-2 mt-3">
                  {family.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-3 flex-wrap" style={{ background: C.soft, borderRadius: 14 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input style={{ ...inputStyle, width: 120, padding: "5px 10px", fontWeight: 800 }} value={m.name}
                          onChange={(e) => setFamily((f) => f.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x))} />
                        <input style={{ ...inputStyle, width: 64, padding: "5px 10px", fontWeight: 800 }} type="number" min="0" value={m.age}
                          onChange={(e) => setFamily((f) => f.map((x) => x.id === m.id ? { ...x, age: Math.max(0, parseInt(e.target.value) || 0) } : x))} />
                        <span style={{ fontSize: 12, color: C.rose, fontWeight: 700 }}>{ageBandLabel(m.age)} portion</span>
                      </div>
                      <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={() => setFamily((f) => f.filter((x) => x.id !== m.id))}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3 items-end flex-wrap">
                  <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Name</label>
                    <input style={{ ...inputStyle, width: 130 }} value={newMember.name} placeholder="Name" onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} /></div>
                  <div className="flex flex-col"><label style={{ fontSize: 12, fontWeight: 800, color: C.deep }}>Age</label>
                    <input style={{ ...inputStyle, width: 80 }} type="number" value={newMember.age} placeholder="Age" onChange={(e) => setNewMember({ ...newMember, age: e.target.value })} /></div>
                  <button style={{ ...btnRose, padding: "9px 18px" }} onClick={() => {
                    if (!newMember.name || newMember.age === "") return;
                    setFamily((f) => [...f, { id: Date.now(), name: newMember.name, age: parseInt(newMember.age) }]);
                    setNewMember({ name: "", age: "" });
                  }}>+ Add</button>
                </div>
                <div className="mt-4 p-3 text-center" style={{ background: C.softer, borderRadius: 14 }}>
                  <span style={{ fontWeight: 800, color: C.deep }}>Total cooking size: </span>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: C.rose, fontWeight: 600 }}>{portions.toFixed(2)} adult portions</span>
                </div>
              </div>

              <div className="p-5" style={card}>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontWeight: 600, fontSize: 18 }}>Eating & cooking rhythm</h3>
                <div className="mt-3">
                  <label style={{ fontWeight: 800, fontSize: 14 }}>Meals per day</label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3].map((n) => (
                      <button key={n} style={{ ...(mealsPerDay === n ? btnRose : btnSoft), padding: "8px 18px" }}
                        onClick={() => { setMealsPerDay(n); setCookSessions(n * 7); setPlan(null); }}>
                        {n} {n === 1 ? "meal" : "meals"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5">
                  <label style={{ fontWeight: 800, fontSize: 14 }}>Cooking sessions per week: <span style={{ color: C.rose }}>{effCook} of {totalSlots} meals</span></label>
                  <input type="range" min="1" max={totalSlots} value={effCook} className="w-full mt-2"
                    onChange={(e) => { setCookSessions(parseInt(e.target.value)); setPlan(null); }} />
                  <p style={{ fontSize: 13, color: C.brownSoft, marginTop: 4 }}>
                    Cook fewer times than you eat, and the planner fills the gaps with leftovers from the last pot — batch cooking, the Nigerian way.
                  </p>
                </div>
                <div className="mt-5 p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <b style={{ color: C.deep }}>Portion guide:</b> Adults (13+) = 1.0 · Children 7–12 = 0.75 · Children 3–6 = 0.5 · Toddlers 1–2 = 0.25
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ RECIPES ============ */}
        {tab === "recipes" && (
          <div>
            <SectionTitle icon="📖" sub={`Every quantity is scaled to your family's ${portions.toFixed(2)} portions. Mains never repeat in a week unless you tick "can repeat" — breakfasts are free to repeat.`}>Recipe Book</SectionTitle>
            {/* Cuisine selector */}
            <div className="flex gap-2 flex-wrap mb-3 items-center">
              <span style={{ fontWeight: 800, color: C.deep, fontSize: 13 }}>Cuisine:</span>
              {[["Both", "🍽️ Both"], ["Nigeria", "🇳🇬 Nigeria"], ["Cameroon", "🇨🇲 Cameroon"]].map(([val, lbl]) => (
                <button key={val} style={{ ...(cuisine === val ? btnRose : btnSoft), padding: "6px 16px", fontSize: 13 }}
                  onClick={() => { setCuisine(val); setRecipeFilter("All"); }}>{lbl}</button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {(cuisine === "Cameroon"
                ? ["All", "Cameroon (NW)", "Cameroon (SW)", "Breakfast"]
                : cuisine === "Nigeria"
                ? ["All", "Igbo", "Yoruba", "Hausa", "Efik / Ibibio", "General", "Breakfast"]
                : ["All", "Igbo", "Yoruba", "Hausa", "Efik / Ibibio", "Cameroon", "General", "Breakfast"]
              ).map((f) => (
                <button key={f} style={{ ...(recipeFilter === f ? btnRose : btnSoft), padding: "6px 14px", fontSize: 13 }} onClick={() => setRecipeFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECIPES.filter((r) => {
                // First, cuisine gate.
                if (cuisine === "Nigeria" && r.origin.startsWith("Cameroon")) return false;
                if (cuisine === "Cameroon" && !r.origin.startsWith("Cameroon")) return false;
                // Then, sub-filter.
                if (recipeFilter === "All") return true;
                if (recipeFilter === "Breakfast") return r.type === "breakfast";
                if (recipeFilter === "Cameroon") return r.origin.startsWith("Cameroon");
                return r.origin === recipeFilter;
              }).map((r, idx) => {
                const locked = isGuest && idx >= 6;
                return (
                <div key={r.id} className="p-4 flex flex-col gap-2 cursor-pointer transition-transform hover:scale-105" style={{ ...card, opacity: locked ? 0.55 : 1 }}
                  onClick={() => locked ? showToast("🔒 This recipe is in the full version — tap ⭐ Buy full access to unlock all " + RECIPES.length + " dishes") : setSelected(r)}>
                  {locked && <Badge color="#B26A00" bg="#FFF3E0">🔒 Full version</Badge>}
                  <div className="flex justify-between items-start gap-2">
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: C.deep, fontSize: 16 }}>{r.name}</div>
                    <Badge>{r.origin}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: C.brownSoft, fontWeight: 700 }}>
                    ⏱ {r.time} · {r.type === "breakfast" ? "🌅 Breakfast" : "🍛 Main dish"}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {r.lasts > 1 && <Badge color={C.green} bg="#E8F5E9">🍱 pot lasts {r.lasts} days</Badge>}
                    {r.freeze && <Badge color="#0277BD" bg="#E1F5FE">❄️ freezer-ok</Badge>}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <Badge color={availabilityScore(r, pantry, portions) >= 0.99 ? C.green : C.amber} bg={availabilityScore(r, pantry, portions) >= 0.99 ? "#E8F5E9" : "#FFF3E0"}>
                      {Math.round(availabilityScore(r, pantry, portions) * 100)}% in stock
                    </Badge>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.brownSoft }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={repeatIds.includes(r.id)}
                        onChange={() => setRepeatIds((ids) => ids.includes(r.id) ? ids.filter((x) => x !== r.id) : [...ids, r.id])} /> can repeat
                    </label>
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}

        {/* ============ WEEKLY PLAN ============ */}
        {tab === "plan" && (
          <div>
            <SectionTitle icon="🗓️" sub={`${mealsPerDay} meal(s)/day · ${portions.toFixed(2)} portions · a varied week, with no main dish twice in a row unless it is an intended carryover.`}>Weekly Cooking Plan</SectionTitle>
            {isGuest && (
              <div className="p-6 text-center mb-4" style={card}>
                <div style={{ fontSize: 40 }}>⭐🔒</div>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontWeight: 600, fontSize: 20, marginTop: 6 }}>The weekly planner is a full-access feature</h3>
                <p style={{ color: C.brownSoft, fontSize: 14, marginTop: 6 }}>
                  Full members get the automatic Mon–Sun cooking schedule, batch-pot and freezer planning,
                  Food Store deduction, the shopping list, and cloud sync across devices.
                </p>
                <button className="mt-4" style={{ ...btnRose, padding: "12px 28px" }} onClick={onUpgrade}>⭐ Buy full access now</button>
              </div>
            )}
            {!isGuest && (<>
            <div className="p-4 mb-4" style={card}>
              <div className="flex gap-2 flex-wrap items-center mb-3">
                <span style={{ fontWeight: 800, color: C.deep, fontSize: 13 }}>Cuisine:</span>
                {[["Both", "🍽️ Both"], ["Nigeria", "🇳🇬 Nigeria"], ["Cameroon", "🇨🇲 Cameroon"]].map(([val, lbl]) => (
                  <button key={val} style={{ ...(cuisine === val ? btnRose : btnSoft), padding: "6px 16px", fontSize: 13 }}
                    onClick={() => { setCuisine(val); setPlan(null); }}>{lbl}</button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <span style={{ fontWeight: 800, color: C.deep, fontSize: 13 }}>Cook once, eat for:</span>
                {[[1, "Every meal fresh"], [2, "2 days"], [3, "3 days"]].map(([val, lbl]) => (
                  <button key={val} style={{ ...(cookAhead === val ? btnRose : btnSoft), padding: "6px 16px", fontSize: 13 }}
                    onClick={() => { setCookAhead(val); setPlan(null); }}>{lbl}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.brownSoft, marginTop: 8 }}>
                Pick 2 or 3 days to cook a bigger pot once and carry it over (or freeze it) for the next day(s).
                Freezer-friendly dishes will be labelled <b>❄️ From freezer</b>; same-pot repeats show as <b>♨️ Carryover</b>.
              </p>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button style={{ ...btnRose, padding: "10px 24px" }} onClick={() => setPlan(generatePlan(mealsPerDay, effCook, repeatIds, pantry, portions, cuisine, cookAhead))}>
                {plan ? "🔀 Shuffle plan" : "✨ Generate my week"}
              </button>
              {plan && <button style={{ ...btnSoft, padding: "10px 20px" }} onClick={() => setPlan(null)}>Clear</button>}
            </div>

            {!plan && (
              <div className="p-8 text-center" style={card}>
                <div style={{ fontSize: 44 }}>🍲🌸</div>
                <p style={{ fontWeight: 700, color: C.brownSoft, marginTop: 6 }}>
                  Tap "Generate my week" and Ite Nri will propose a full schedule, favouring dishes your Food Store can already cook.
                </p>
              </div>
            )}

            {plan && (
              <div className="flex flex-col gap-3">
                {DAYS.map((day) => {
                  const daySlots = plan.filter((s) => s.day === day);
                  return (
                    <div key={day} className="p-4" style={card}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontWeight: 600, marginBottom: 8 }}>🌺 {day}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {daySlots.map((s, i) => {
                          const r = RECIPES.find((x) => x.id === s.recipeId);
                          return (
                            <div key={i} className="p-3" style={{ background: s.cook ? C.soft : "#FFF9E6", borderRadius: 14, border: `1.5px dashed ${s.cook ? C.border : "#FFE0A3"}` }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: C.brownSoft, textTransform: "uppercase", letterSpacing: 1 }}>{s.meal}</div>
                              <div className="cursor-pointer" style={{ fontWeight: 800, color: C.deep, fontSize: 14, marginTop: 2 }} onClick={() => r && setSelected(r)}>
                                {r ? r.name : "—"}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                {s.cook && (
                                  <Badge color={C.rose}>
                                    👩🏾‍🍳 Cook fresh{s.cookAhead > 1 ? ` · big pot for ${s.cookAhead} days` : ""}
                                  </Badge>
                                )}
                                {!s.cook && s.tag === "repeat" && <Badge color="#6A1B9A" bg="#F3E5F5">🔁 Breakfast repeat</Badge>}
                                {!s.cook && (s.tag === "freezer" || s.fromFreezer) && <Badge color="#0277BD" bg="#E1F5FE">❄️ From freezer</Badge>}
                                {!s.cook && s.tag === "leftover" && !s.fromFreezer && (
                                  <Badge color={C.amber} bg="#FFF3E0">♨️ Carryover{s.potDay ? ` · day ${s.potDay} of ${s.potLasts}` : ""}</Badge>
                                )}
                                {s.cook && r && (
                                  <button style={{ ...btnSoft, padding: "3px 10px", fontSize: 12 }} onClick={() => cookRecipe(r)}>Cook ✓</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </>)}
          </div>
        )}
      </main>

      <Footer />

      {/* ============ RECIPE MODAL ============ */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.45)", zIndex: 50 }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg p-6 overflow-y-auto" style={{ ...card, maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 24, fontWeight: 600 }}>{selected.name}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge>{selected.origin}</Badge>
                  <Badge color={C.brownSoft} bg="#EFEBE9">⏱ {selected.time}</Badge>
                  {selected.lasts > 1 && <Badge color={C.green} bg="#E8F5E9">🍱 One pot feeds you {selected.lasts} days</Badge>}
                  {selected.freeze && <Badge color="#0277BD" bg="#E1F5FE">❄️ Extra portions can be frozen</Badge>}
                  {selected.serveWith && <Badge color={C.green} bg="#E8F5E9">Serve with {selected.serveWith}</Badge>}
                </div>
              </div>
              <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={() => setSelected(null)}>✕</button>
            </div>

            <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.rose, fontWeight: 600, marginTop: 16 }}>
              🧾 Ingredients — scaled for {portions.toFixed(2)} portions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
              {selected.ingredients.map((ing, i) => {
                const item = matchPantry(pantry, ing.n);
                const needed = ing.q * portions;
                const ok = item && item.unit === ing.u && item.qty >= needed;
                return (
                  <div key={i} className="flex justify-between items-center px-3 py-2" style={{ background: C.soft, borderRadius: 10, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{ok ? "✅" : "🛒"} {ing.n}</span>
                    <span style={{ fontWeight: 800, color: ok ? C.green : C.amber }}>{fmtQty(needed, ing.u)}</span>
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: C.rose, fontWeight: 600, marginTop: 16 }}>👩🏾‍🍳 Steps</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {selected.steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span style={{ background: C.rose, color: "#fff", borderRadius: "50%", minWidth: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{i + 1}</span>
                  <span style={{ fontSize: 14 }}>{s}</span>
                </li>
              ))}
            </ol>

            <button className="w-full mt-5" style={{ ...btnRose, padding: "12px" }} onClick={() => { cookRecipe(selected); setSelected(null); }}>
              🍲 Cook this now — deduct from Food Store
            </button>
          </div>
        </div>
      )}

      {/* ============ NOTIFICATIONS PANEL ============ */}
      {showNotif && (
        <div className="fixed inset-0 flex items-start justify-center p-4" style={{ background: "rgba(93,64,55,0.45)", zIndex: 55, paddingTop: 80 }} onClick={() => setShowNotif(false)}>
          <div className="w-full max-w-md p-5" style={{ ...card, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 20, fontWeight: 600 }}>🔔 Alerts</h2>
              <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={() => setShowNotif(false)}>✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3" style={{ background: n.kind === "stock" ? "#FFF3E0" : n.kind === "meal" ? C.soft : "#E8F5E9", borderRadius: 12 }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.brown }}>{n.text}</span>
                </div>
              ))}
            </div>
            {lowStock.length > 0 && (
              <button className="w-full mt-4" style={{ ...btnSoft, padding: 10 }} onClick={() => { setShowNotif(false); setTab("pantry"); }}>
                🥘 Go to Food Store to restock
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============ WELCOME MODAL ============ */}
      {showWelcome && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.5)", zIndex: 65 }} onClick={() => setShowWelcome(false)}>
          <div className="w-full max-w-md p-7 text-center" style={{ ...card }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 46 }}>🍲🌸</div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", color: C.deep, fontSize: 24, fontWeight: 600, marginTop: 6 }}>
              Welcome to {APP_NAME}!
            </h2>
            <p style={{ color: C.brown, fontSize: 15, marginTop: 10, lineHeight: 1.5 }}>
              {profile.full_name ? `${profile.full_name}, y` : "Y"}our personal cooking companion is ready.
              Start by adding what's in your <b>Food Store</b>, then let us plan a delicious week of
              Nigerian and Cameroonian meals — with smart portions and less waste.
            </p>
            <p style={{ color: C.brownSoft, fontSize: 13, marginTop: 10 }}>Made with ❤️ by Jodel Technologies.</p>
            <button className="w-full mt-5" style={{ ...btnRose, padding: 12 }} onClick={() => { setShowWelcome(false); setTab("pantry"); }}>
              🥘 Let's stock my kitchen
            </button>
            <button className="w-full mt-2" style={{ ...btnSoft, padding: 10 }} onClick={() => setShowWelcome(false)}>
              Explore first
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 px-5 py-3" style={{ transform: "translateX(-50%)", background: C.deep, color: "#fff", borderRadius: 999, fontWeight: 700, zIndex: 60, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
