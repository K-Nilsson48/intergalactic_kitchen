// ---------------------------------------------------------
// EXPERIMENT CONFIGURATION (Change trial count here!)
// ---------------------------------------------------------
const number_of_rounds_per_block = 5; // Number of recipes per feedback section (e.g., 5 for pilot, 10 for full study)
const total_recipes = number_of_rounds_per_block * 5;
const recipe_word = number_of_rounds_per_block === 1 ? "recipe" : "recipes";

// ---------------------------------------------------------
// Database Saving Function (Connects to write_data.php)
// ---------------------------------------------------------
function save_data(data, table) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'write_data.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    if (xhr.status === 200) {
      console.log("Saved to " + table + ":", xhr.responseText);
    } else {
      console.error("Error saving to " + table + ":", xhr.statusText);
    }
  };
  xhr.send("data=" + data + "&table=" + table);
}

// ---------------------------------------------------------
// Array Shuffling Helper
// ---------------------------------------------------------
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ---------------------------------------------------------
// Feedback Generation Functions
// ---------------------------------------------------------

// System A: Standard Binary Feedback (Used on Winning Screen)
function getBinaryFeedback(is_correct, attempts) {
  if (is_correct) {
    return `
      <div style="text-align: center;">
        <h1 style="color: #2e7d32;">Delicious!</h1>
        <p style="font-size: 1.2rem;">You discovered the secret recipe in <strong>${attempts}</strong> ${attempts === 1 ? 'attempt' : 'attempts'}!</p>
        <p style="color: #555;">Press any key to move on to the next recipe.</p>
      </div>
    `;
  } else {
    return `
      <div style="text-align: center;">
        <h1 style="color: #c62828;">Not quite...</h1>
        <p>That doesn't taste right. Press any key to empty the pot and try again.</p>
      </div>
    `;
  }
}

// System B: Count Feedback (Intersection of arrays)
function getCountFeedback(selection, target) {
  const correct_count = selection.filter(item => target.includes(item)).length;
  return `
    <div style="text-align: center;">
      <h1 style="color: #ef6c00;">Taste Test: Correct Ingredients Included</h1>
      <p style="font-size: 1.25rem;">Your pot contains <strong>${correct_count}</strong> correct ${correct_count === 1 ? 'ingredient' : 'ingredients'}!</p>
      <p style="color: #555;">(Note: This score only counts correct ingredients you added; extra ingredients are not penalized.)</p>
      <p>Press any key to empty the pot and try again.</p>
    </div>
  `;
}

// System C: Correct Number Feedback (Total Correct Decisions out of 5)
function getCorrectNumFeedback(selection, target, pool) {
  let correctly_included = 0;
  let correctly_excluded = 0;

  pool.forEach(item => {
    const is_in_target = target.includes(item);
    const is_in_selection = selection.includes(item);

    if (is_in_target && is_in_selection) {
      correctly_included++;
    } else if (!is_in_target && !is_in_selection) {
      correctly_excluded++;
    }
  });

  const total_correct_decisions = correctly_included + correctly_excluded;

  return `
    <div style="text-align: center;">
      <h1 style="color: #1565c0;">Kitchen Analysis: Total Correct Decisions</h1>
      <p style="font-size: 1.25rem;">You made <strong>${total_correct_decisions} out of ${pool.length}</strong> correct ingredient decisions!</p>
      <p style="color: #555;">(Counts both correct ingredients you <em>added</em> AND wrong ingredients you <em>left out</em>.)</p>
      <p>Press any key to empty the pot and try again.</p>
    </div>
  `;
}

// System D: Distance Feedback (Changes Needed)
function getDistanceFeedback(selection, target, pool) {
  let correctly_included = 0;
  let correctly_excluded = 0;

  pool.forEach(item => {
    const is_in_target = target.includes(item);
    const is_in_selection = selection.includes(item);

    if (is_in_target && is_in_selection) {
      correctly_included++;
    } else if (!is_in_target && !is_in_selection) {
      correctly_excluded++;
    }
  });

  const total_distance = pool.length - correctly_included - correctly_excluded;

  return `
    <div style="text-align: center;">
      <h1 style="color: #6a1b9a;">Kitchen Analysis: Steps Away</h1>
      <p style="font-size: 1.25rem;">You are <strong>${total_distance}</strong> ${total_distance === 1 ? 'change' : 'changes'} away from the secret recipe!</p>
      <p style="color: #555;">(Each missing ingredient you need to add or extra ingredient you need to remove counts as 1 change.)</p>
      <p>Press any key to empty the pot and try again.</p>
    </div>
  `;
}

// ---------------------------------------------------------
// Instruction Blocks
// ---------------------------------------------------------

// 1. Initial Welcome & Control Tutorial
const ui_instructions = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 720px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1>Welcome to The Intergalactic Kitchen!</h1>
       <p>In this study, you are the new head chef aboard an alien spaceship. Your job is to figure out secret soup recipes by testing combinations of alien ingredients in the cooking pot.</p>
       <div style="text-align: left; background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 18px 25px; margin: 20px auto; max-width: 560px;">
         <p style="margin: 6px 0;"><strong>1. Add to Pot:</strong> Click any ingredient card to add it to the pot (it will highlight in <span style="color: #2e7d32; font-weight: bold;">green</span>).</p>
         <p style="margin: 6px 0;"><strong>2. Remove from Pot:</strong> Click a highlighted ingredient card again to remove it.</p>
         <p style="margin: 6px 0;"><strong>3. Test the Soup:</strong> Click the submit button at the bottom of the screen to see your feedback score!</p>
       </div>
       <p>After each test, the pot resets so you can adjust your recipe on the next attempt.</p>
     </div>`,
    `<div style="max-width: 720px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1>Quick Practice Round</h1>
       <p>Before entering the alien kitchen, let's do one quick practice round using familiar Earth ingredients to get comfortable with the controls.</p>
       <p>For this practice soup, the recipe requires <strong>Onions</strong> and <strong>AP Flour</strong> (and nothing else).</p>
       <p>Click <strong>Next</strong> to select these two ingredients!</p>
     </div>`
  ],
  show_clickable_nav: true
};

// 2. Transition into the Alien Kitchen
const alien_kitchen_intro = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 780px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1>Entering the Alien Kitchen</h1>
       <p>Great job! Now you are ready for the alien kitchen. Instead of Earth food, you will cook with <strong>5 alien ingredients</strong>, each with its own geometric shape and color:</p>
       <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 20px 0;">
         <div style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 130px; background: #fafafa;">
           <img src="img/Yellow Hexagon.png" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 6px;">
           <strong>Solar Crystal</strong><br><span style="font-size: 0.85em; color: #666;">(Yellow Hexagon)</span>
         </div>
         <div style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 130px; background: #fafafa;">
           <img src="img/Red Square.png" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 6px;">
           <strong>Magma Cube</strong><br><span style="font-size: 0.85em; color: #666;">(Red Square)</span>
         </div>
         <div style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 130px; background: #fafafa;">
           <img src="img/Purple Square.png" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 6px;">
           <strong>Nebula Block</strong><br><span style="font-size: 0.85em; color: #666;">(Purple Square)</span>
         </div>
         <div style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 130px; background: #fafafa;">
           <img src="img/Red Triangle.png" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 6px;">
           <strong>Flare Pod</strong><br><span style="font-size: 0.85em; color: #666;">(Red Triangle)</span>
         </div>
         <div style="border: 2px solid #ddd; border-radius: 10px; padding: 10px; width: 130px; background: #fafafa;">
           <img src="img/Purple Triangle.png" style="width: 80px; height: 80px; object-fit: contain; display: block; margin: 0 auto 6px;">
           <strong>Void Shard</strong><br><span style="font-size: 0.85em; color: #666;">(Purple Triangle)</span>
         </div>
       </div>
       <p>The experiment is divided into <strong>3 sections</strong>, and you will solve <strong>${number_of_rounds_per_block} secret ${recipe_word} per section</strong> (${total_recipes} recipes total).</p>
       <p>Each section uses a <strong>different feedback rule</strong> to give you clues after each guess. Your goal is always the same: <strong>discover each secret recipe in as few attempts as possible!</strong></p>
     </div>`
  ],
  show_clickable_nav: true
};

// 3. Structural Hint
const instructions_known = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 720px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1>The Golden Rule of Alien Shapes</h1>
       <p>Before you begin, here is an important secret about how all alien recipes are created:</p>
       <p><strong>The Golden Rule:</strong> Every secret recipe will contain <strong>at most ONE</strong> ingredient from each shape category:</p>
       <div style="text-align: left; background: #f1f8e9; border-left: 5px solid #4CAF50; padding: 15px 25px; margin: 18px auto; max-width: 520px; border-radius: 4px;">
         <p style="margin: 8px 0;"><strong>Hexagon (at most 1):</strong> Solar Crystal <em>(Yellow Hexagon)</em></p>
         <p style="margin: 8px 0;"><strong>Square (at most 1):</strong> Magma Cube <em>(Red Square)</em> OR Nebula Block <em>(Purple Square)</em></p>
         <p style="margin: 8px 0;"><strong>Triangle (at most 1):</strong> Flare Pod <em>(Red Triangle)</em> OR Void Shard <em>(Purple Triangle)</em></p>
       </div>
       <p>A shape category might be left out of a recipe completely, but a secret recipe will <strong>never</strong> contain two Squares (both Magma Cube and Nebula Block) or two Triangles (both Flare Pod and Void Shard) at the same time!</p>
     </div>`
  ],
  show_clickable_nav: true
};

// 4. Block Instructions: Count / Intersection ('count')
const instructions_intersection = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 750px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1 style="color: #ef6c00;">Feedback Rule: Correct Ingredients Included</h1>
       <p>For the next <strong>${number_of_rounds_per_block} ${recipe_word}</strong>, the kitchen analyzer will score your pot using the <strong>Correct Ingredients Included</strong> rule.</p>
       <p><strong>The Rule:</strong> Your score is the exact number of ingredients currently in your pot that also belong in the secret recipe. Extra (wrong) ingredients in your pot do not lower this number.</p>
       <div style="text-align: left; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px 24px; margin: 18px auto; max-width: 650px;">
         <p style="margin-top: 0; text-align: center;"><strong>Example Secret Recipe: [Solar Crystal, Magma Cube]</strong></p>
         <p style="margin: 10px 0;"><strong>Example A (Partial Match):</strong> You guess <strong>[Solar Crystal, Nebula Block]</strong><br>
         <span style="color: #ef6c00; font-weight: bold;">Score: 1</span> - You correctly included Solar Crystal (1). Nebula Block is not in the recipe (0).</p>
         <p style="margin: 10px 0;"><strong>Example B (Over-Guess):</strong> You guess <strong>[Solar Crystal, Magma Cube, Void Shard]</strong><br>
         <span style="color: #ef6c00; font-weight: bold;">Score: 2</span> - Both Solar Crystal and Magma Cube are in the recipe (2). However, you still need to remove the extra Void Shard to win!</p>
         <p style="margin: 10px 0;"><strong>Example C (Complete Miss):</strong> You guess <strong>[Void Shard]</strong><br>
         <span style="color: #ef6c00; font-weight: bold;">Score: 0</span> - None of the ingredients in your pot belong in the secret recipe.</p>
       </div>
       <p>Click <strong>Next</strong> to begin your ${number_of_rounds_per_block} ${recipe_word} with this feedback rule!</p>
     </div>`
  ],
  show_clickable_nav: true
};

// 5. Block Instructions: Total Correct Decisions ('correct_num')
const instructions_correct_num = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 750px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1 style="color: #1565c0;">Feedback Rule: Total Correct Decisions (Out of 5)</h1>
       <p>For the next <strong>${number_of_rounds_per_block} ${recipe_word}</strong>, the kitchen analyzer will evaluate your choices across <strong>all 5 ingredients</strong> in the kitchen.</p>
       <p><strong>The Rule:</strong> You get <strong>1 point</strong> for each secret ingredient you <strong>included</strong>, AND <strong>1 point</strong> for each wrong ingredient you <strong>left out</strong>. A score of <strong>5 out of 5</strong> means you found the recipe!</p>
       <div style="text-align: left; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 16px 24px; margin: 18px auto; max-width: 650px;">
         <p style="margin-top: 0; text-align: center;"><strong>Example Secret Recipe: [Solar Crystal, Magma Cube]</strong><br><em>(Meaning Nebula Block, Flare Pod, and Void Shard should be left out)</em></p>
         <p style="margin: 10px 0;"><strong>Example A (Partial Match):</strong> You guess <strong>[Solar Crystal, Nebula Block]</strong><br>
         <span style="color: #1565c0; font-weight: bold;">Score: 3 out of 5</span> - 3 right decisions (included Solar Crystal, left out Flare Pod and Void Shard) and 2 mistakes (missed Magma Cube, added Nebula Block).</p>
         <p style="margin: 10px 0;"><strong>Example B (Over-Guess):</strong> You guess <strong>[Solar Crystal, Magma Cube, Void Shard]</strong><br>
         <span style="color: #1565c0; font-weight: bold;">Score: 4 out of 5</span> - 4 right decisions (included Solar Crystal and Magma Cube, left out Nebula Block and Flare Pod) and 1 mistake (added Void Shard).</p>
         <p style="margin: 10px 0;"><strong>Example C (Complete Miss):</strong> You guess <strong>[Void Shard]</strong><br>
         <span style="color: #1565c0; font-weight: bold;">Score: 2 out of 5</span> - Even though you missed Solar Crystal and Magma Cube and added Void Shard, you still earn 2 points for leaving out Nebula Block and Flare Pod!</p>
       </div>
       <p>Click <strong>Next</strong> to begin your ${number_of_rounds_per_block} ${recipe_word} with this feedback rule!</p>
     </div>`
  ],
  show_clickable_nav: true
};

// 6. Block Instructions: Steps Away / Distance ('distance')
const instructions_action_model = {
  type: jsPsychInstructions,
  pages: [
    `<div style="max-width: 750px; margin: 0 auto; line-height: 1.6; text-align: center;">
       <h1 style="color: #6a1b9a;">Feedback Rule: Changes Needed ("Steps Away")</h1>
       <p>For the next <strong>${number_of_rounds_per_block} ${recipe_word}</strong>, the kitchen analyzer will tell you how many <strong>changes (steps away)</strong> you need to make to fix your pot.</p>
       <p><strong>The Rule:</strong> Every missing ingredient you need to <strong>add</strong> counts as 1 change, and every wrong ingredient you need to <strong>remove</strong> counts as 1 change. A score of <strong>0 changes</strong> means you found the recipe!</p>
       <div style="text-align: left; background: #f3e5f5; border: 1px solid #ce93d8; border-radius: 8px; padding: 16px 24px; margin: 18px auto; max-width: 650px;">
         <p style="margin-top: 0; text-align: center;"><strong>Example Secret Recipe: [Solar Crystal, Magma Cube]</strong></p>
         <p style="margin: 10px 0;"><strong>Example A (Partial Match):</strong> You guess <strong>[Solar Crystal, Nebula Block]</strong><br>
         <span style="color: #6a1b9a; font-weight: bold;">Score: 2 changes needed</span> - Remove Nebula Block (1) + Add Magma Cube (1) = 2 actions.</p>
         <p style="margin: 10px 0;"><strong>Example B (Over-Guess):</strong> You guess <strong>[Solar Crystal, Magma Cube, Void Shard]</strong><br>
         <span style="color: #6a1b9a; font-weight: bold;">Score: 1 change needed</span> - You only need 1 action to fix the pot: remove Void Shard!</p>
         <p style="margin: 10px 0;"><strong>Example C (Complete Miss):</strong> You guess <strong>[Void Shard]</strong><br>
         <span style="color: #6a1b9a; font-weight: bold;">Score: 3 changes needed</span> - Remove Void Shard (1) + Add Solar Crystal (1) + Add Magma Cube (1) = 3 actions.</p>
       </div>
       <p>Click <strong>Next</strong> to begin your ${number_of_rounds_per_block} ${recipe_word} with this feedback rule!</p>
     </div>`
  ],
  show_clickable_nav: true
};