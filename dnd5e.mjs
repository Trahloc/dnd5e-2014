/**
 * The D&D fifth edition game system for Foundry Virtual Tabletop
 * A system for playing the fifth edition of the world's most popular role-playing game.
 * Author: Atropos
 * Software License: MIT
 * Content License: https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf
 * Repository: https://github.com/foundryvtt/dnd5e
 * Issue Tracker: https://github.com/foundryvtt/dnd5e/issues
 */

// Import Configuration
import DND5E from "./module/config.mjs";
import { registerSystemSettings, registerDeferredSettings } from "./module/settings.mjs";

// Import Submodules
import * as applications from "./module/applications/_module.mjs";
import * as canvas from "./module/canvas/_module.mjs";
import * as dataModels from "./module/data/_module.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as documents from "./module/documents/_module.mjs";
import * as enrichers from "./module/enrichers.mjs";
import * as Filter from "./module/filter.mjs";
import * as migrations from "./module/migration.mjs";
import * as utils from "./module/utils.mjs";
import {ModuleArt} from "./module/module-art.mjs";
import Tooltips5e from "./module/tooltips.mjs";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.dnd5e = {
  applications,
  canvas,
  config: DND5E,
  dataModels,
  dice,
  documents,
  enrichers,
  Filter,
  migrations,
  utils
};

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
  globalThis.dnd5e = game.dnd5e = Object.assign(game.system, globalThis.dnd5e);
  console.log(`D&D 5e | Initializing the D&D Fifth Game System - Version ${dnd5e.version}\n${DND5E.ASCII}`);

  // ====================================================================
  // SAFE MODULE COMPATIBILITY LAYER
  // ====================================================================
  
  // This layer provides 1:1 compatibility with dnd5e modules WITHOUT overriding
  // Foundry's core APIs or stepping on other systems' functionality.
  //
  // SAFE APPROACH:
  // ✅ Creates helper functions (game.dnd5e.getSetting, etc.)
  // ✅ Adds optional Document methods (getDnd5eFlag, etc.)  
  // ✅ Provides legacy access points (game.system.legacyId)
  // ✅ Never modifies core Foundry prototypes destructively
  // ✅ No stack trace detection or call interception
  // ✅ Works alongside other systems without conflicts
  //
  // MODULES CAN:
  // - Use game.dnd5e.getSetting("key") instead of game.settings.get("dnd5e", "key")
  // - Use actor.getDnd5eFlag("key") instead of actor.getFlag("dnd5e", "key") 
  // - Check game.system.isCompatibleWith("dnd5e") for compatibility
  // - Access all dnd5e APIs through game.dnd5e.* namespace
  
  // Game namespace compatibility for module checks
  if (!game.system._dnd5e2014CompatibilityAdded) {
    // Add compatibility method for modules that check system.id
    game.system.isCompatibleWith = function(systemId) {
      return systemId === 'dnd5e-2014' || systemId === 'dnd5e';
    };
    
    // Provide legacy game.dnd5e access point for modules
    if (!game.dnd5e && globalThis.dnd5e) {
      game.dnd5e = globalThis.dnd5e;
    }
    
    // ====================================================================
    // SAFE COMPATIBILITY HELPERS FOR MODULES
    // ====================================================================
    
    // Create safe wrapper functions that modules can use instead of direct API calls
    
    // Safe settings helper - modules can call game.dnd5e.getSetting() instead of game.settings.get("dnd5e", ...)
    game.dnd5e.getSetting = function(key) {
      // Always use our system ID for settings
      return game.settings.get("dnd5e-2014", key);
    };
    
    game.dnd5e.setSetting = function(key, value) {
      return game.settings.set("dnd5e-2014", key, value);
    };
    
    // Safe flag helpers - modules can call actor.getDnd5eFlag() instead of actor.getFlag("dnd5e", ...)
    if (!foundry.abstract.Document.prototype.getDnd5eFlag) {
      foundry.abstract.Document.prototype.getDnd5eFlag = function(key) {
        return this.getFlag("dnd5e-2014", key);
      };
      
      foundry.abstract.Document.prototype.setDnd5eFlag = function(key, value) {
        return this.setFlag("dnd5e-2014", key, value);
      };
      
      foundry.abstract.Document.prototype.unsetDnd5eFlag = function(key) {
        return this.unsetFlag("dnd5e-2014", key);
      };
    }
    
    // Create legacy system ID alias for module compatibility checks
    Object.defineProperty(game.system, 'legacyId', {
      value: 'dnd5e',
      writable: false,
      enumerable: true
    });
    
    // ====================================================================
    // BIDIRECTIONAL COMPATIBILITY HELPERS
    // ====================================================================
    
    // Dynamic CSS class helper for dialogs and sheets
    game.dnd5e.getCSSClasses = function(baseClasses = []) {
      const systemClasses = [];
      // Always include both variants for maximum compatibility
      if (game.system.id === 'dnd5e-2014') {
        systemClasses.push('dnd5e-2014', 'dnd5e'); // Primary: dnd5e-2014, fallback: dnd5e
      } else {
        systemClasses.push('dnd5e', 'dnd5e-2014'); // Primary: dnd5e, fallback: dnd5e-2014  
      }
      return [...systemClasses, ...baseClasses];
    };
    
    // Dynamic CSS class helper for v2 sheets
    game.dnd5e.getCSSClassesV2 = function(baseClasses = []) {
      const systemClasses = [];
      if (game.system.id === 'dnd5e-2014') {
        systemClasses.push('dnd5e-2014-2', 'dnd5e2'); // Primary: dnd5e-2014-2, fallback: dnd5e2
      } else {
        systemClasses.push('dnd5e2', 'dnd5e-2014-2'); // Primary: dnd5e2, fallback: dnd5e-2014-2
      }
      return [...systemClasses, ...baseClasses];
    };
    
    // Bidirectional compendium reference helper
    game.dnd5e.getCompendiumReference = function(originalPath) {
      // If it's already for our system, return as-is
      if (originalPath.startsWith(`Compendium.${game.system.id}.`)) {
        return originalPath;
      }
      
      // Convert between dnd5e <-> dnd5e-2014
      if (originalPath.startsWith('Compendium.dnd5e.')) {
        return originalPath.replace('Compendium.dnd5e.', `Compendium.${game.system.id}.`);
      }
      if (originalPath.startsWith('Compendium.dnd5e-2014.')) {
        return originalPath.replace('Compendium.dnd5e-2014.', `Compendium.${game.system.id}.`);
      }
      
      return originalPath; // Return unchanged if not a d&d5e compendium
    };
    
    // Bidirectional compendium lookup with fallback
    game.dnd5e.findCompendiumEntry = async function(referencePath) {
      // Try current system first
      const currentSystemPath = game.dnd5e.getCompendiumReference(referencePath);
      let document = await fromUuid(currentSystemPath);
      
      if (!document) {
        // Try fallback system
        const fallbackPath = referencePath.startsWith('Compendium.dnd5e-2014.') 
          ? referencePath.replace('Compendium.dnd5e-2014.', 'Compendium.dnd5e.')
          : referencePath.replace('Compendium.dnd5e.', 'Compendium.dnd5e-2014.');
        document = await fromUuid(fallbackPath);
      }
      
      return document;
    };
    
    game.system._dnd5e2014CompatibilityAdded = true;
  }
  
  console.log("D&D 5e 2014 | System loaded with smart module compatibility");




  // TODO: Remove when v11 support is dropped.
  CONFIG.compatibility.excludePatterns.push(/filePicker|select/);
  CONFIG.compatibility.excludePatterns.push(/foundry\.dice\.terms/);
  CONFIG.compatibility.excludePatterns.push(
    /aggregateDamageRoll|configureDamage|preprocessFormula|simplifyRollFormula/
  );
  CONFIG.compatibility.excludePatterns.push(/core\.sourceId/);
  if ( game.release.generation < 12 ) Math.clamp = Math.clamped;

  // ====================================================================
  // DYNAMIC COMPENDIUM REFERENCE RESOLUTION
  // ====================================================================
  
  // Before setting CONFIG.DND5E, dynamically resolve compendium references
  function resolveDynamicReferences(obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('Compendium.dnd5e.')) {
        // Convert dnd5e references to current system
        obj[key] = value.replace('Compendium.dnd5e.', `Compendium.${game.system.id}.`);
      } else if (typeof value === 'object' && value !== null) {
        resolveDynamicReferences(value);
      }
    }
  }
  
  // Apply dynamic resolution to the entire DND5E config
  resolveDynamicReferences(DND5E);
  
  // Record Configuration Values
  CONFIG.DND5E = DND5E;
  CONFIG.ActiveEffect.documentClass = documents.ActiveEffect5e;
  CONFIG.ActiveEffect.legacyTransferral = false;
  CONFIG.Actor.documentClass = documents.Actor5e;
  CONFIG.ChatMessage.documentClass = documents.ChatMessage5e;
  CONFIG.Combat.documentClass = documents.Combat5e;
  CONFIG.Combatant.documentClass = documents.Combatant5e;
  CONFIG.Item.collection = dataModels.collection.Items5e;
  CONFIG.Item.compendiumIndexFields.push("system.container");
  CONFIG.Item.documentClass = documents.Item5e;
  CONFIG.Token.documentClass = documents.TokenDocument5e;
  CONFIG.Token.objectClass = canvas.Token5e;
  CONFIG.Token.ringClass = canvas.TokenRing;
  CONFIG.User.documentClass = documents.User5e;
  CONFIG.time.roundTime = 6;
  Roll.TOOLTIP_TEMPLATE = "systems/dnd5e-2014/templates/chat/roll-breakdown.hbs";
  CONFIG.Dice.DamageRoll = dice.DamageRoll;
  CONFIG.Dice.D20Roll = dice.D20Roll;
  CONFIG.MeasuredTemplate.defaults.angle = 53.13; // 5e cone RAW should be 53.13 degrees
  CONFIG.Note.objectClass = canvas.Note5e;
  CONFIG.ui.combat = applications.combat.CombatTracker5e;
  CONFIG.ui.items = dnd5e.applications.item.ItemDirectory5e;

  // Register System Settings
  registerSystemSettings();

  // Configure module art
  game.dnd5e.moduleArt = new ModuleArt();

  // Configure tooltips
  game.dnd5e.tooltips = new Tooltips5e();

  // Set up status effects
  _configureStatusEffects();

  // Remove honor & sanity from configuration if they aren't enabled
  if ( !game.settings.get("dnd5e-2014", "honorScore") ) delete DND5E.abilities.hon;
  if ( !game.settings.get("dnd5e-2014", "sanityScore") ) delete DND5E.abilities.san;

  // Register Roll Extensions
  CONFIG.Dice.rolls.push(dice.D20Roll);
  CONFIG.Dice.rolls.push(dice.DamageRoll);

  // Hook up system data types
  CONFIG.Actor.dataModels = dataModels.actor.config;
  CONFIG.Item.dataModels = dataModels.item.config;
  CONFIG.JournalEntryPage.dataModels = dataModels.journal.config;

  // Add fonts
  _configureFonts();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("dnd5e-2014", applications.actor.ActorSheet5eCharacter, {
    types: ["character"],
    label: "DND5E.SheetClassCharacterLegacy"
  });
  DocumentSheetConfig.registerSheet(Actor, "dnd5e-2014", applications.actor.ActorSheet5eCharacter2, {
    types: ["character"],
    makeDefault: true,
    label: "DND5E.SheetClassCharacter"
  });
  Actors.registerSheet("dnd5e-2014", applications.actor.ActorSheet5eNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "DND5E.SheetClassNPCLegacy"
  });
  DocumentSheetConfig.registerSheet(Actor, "dnd5e-2014", applications.actor.ActorSheet5eNPC2, {
    types: ["npc"],
    makeDefault: true,
    label: "DND5E.SheetClassNPC"
  });
  Actors.registerSheet("dnd5e-2014", applications.actor.ActorSheet5eVehicle, {
    types: ["vehicle"],
    makeDefault: true,
    label: "DND5E.SheetClassVehicle"
  });
  Actors.registerSheet("dnd5e-2014", applications.actor.GroupActorSheet, {
    types: ["group"],
    makeDefault: true,
    label: "DND5E.SheetClassGroup"
  });

  DocumentSheetConfig.unregisterSheet(Item, "core", ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "dnd5e-2014", applications.item.ItemSheet5e, {
    makeDefault: true,
    label: "DND5E.SheetClassItem"
  });
  DocumentSheetConfig.unregisterSheet(Item, "dnd5e-2014", applications.item.ItemSheet5e, { types: ["container"] });
  DocumentSheetConfig.registerSheet(Item, "dnd5e-2014", applications.item.ContainerSheet, {
    makeDefault: true,
    types: ["container"],
    label: "DND5E.SheetClassContainer"
  });

  DocumentSheetConfig.registerSheet(JournalEntry, "dnd5e-2014", applications.journal.JournalSheet5e, {
    makeDefault: true,
    label: "DND5E.SheetClassJournalEntry"
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "dnd5e-2014", applications.journal.JournalClassPageSheet, {
    label: "DND5E.SheetClassClassSummary",
    types: ["class", "subclass"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "dnd5e-2014", applications.journal.JournalMapLocationPageSheet, {
    label: "DND5E.SheetClassMapLocation",
    types: ["map"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "dnd5e-2014", applications.journal.JournalRulePageSheet, {
    label: "DND5E.SheetClassRule",
    types: ["rule"]
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, "dnd5e-2014", applications.journal.JournalSpellListPageSheet, {
    label: "DND5E.SheetClassSpellList",
    types: ["spells"]
  });

  CONFIG.Token.prototypeSheetClass = applications.TokenConfig5e;
  DocumentSheetConfig.unregisterSheet(TokenDocument, "core", TokenConfig);
  DocumentSheetConfig.registerSheet(TokenDocument, "dnd5e-2014", applications.TokenConfig5e, {
    label: "DND5E.SheetClassToken"
  });

  // Preload Handlebars helpers & partials
  utils.registerHandlebarsHelpers();
  utils.preloadHandlebarsTemplates();

  // Enrichers
  enrichers.registerCustomEnrichers();

  // Exhaustion handling
  documents.ActiveEffect5e.registerHUDListeners();
});

/* -------------------------------------------- */

/**
 * Configure explicit lists of attributes that are trackable on the token HUD and in the combat tracker.
 * @internal
 */
function _configureTrackableAttributes() {
  const common = {
    bar: [],
    value: [
      ...Object.keys(DND5E.abilities).map(ability => `abilities.${ability}.value`),
      ...Object.keys(DND5E.movementTypes).map(movement => `attributes.movement.${movement}`),
      "attributes.ac.value", "attributes.init.total"
    ]
  };

  const altSpells = Object.entries(DND5E.spellPreparationModes).reduce((acc, [k, v]) => {
    if ( !["prepared", "always"].includes(k) && v.upcast ) acc.push(`spells.${k}`);
    return acc;
  }, []);

  const creature = {
    bar: [
      ...common.bar,
      "attributes.hp",
      ...altSpells,
      ...Array.fromRange(Object.keys(DND5E.spellLevels).length - 1, 1).map(l => `spells.spell${l}`)
    ],
    value: [
      ...common.value,
      ...Object.keys(DND5E.skills).map(skill => `skills.${skill}.passive`),
      ...Object.keys(DND5E.senses).map(sense => `attributes.senses.${sense}`),
      "attributes.spelldc"
    ]
  };

  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: [...creature.bar, "resources.primary", "resources.secondary", "resources.tertiary", "details.xp"],
      value: [...creature.value]
    },
    npc: {
      bar: [...creature.bar, "resources.legact", "resources.legres"],
      value: [...creature.value, "details.cr", "details.spellLevel", "details.xp.value"]
    },
    vehicle: {
      bar: [...common.bar, "attributes.hp"],
      value: [...common.value]
    },
    group: {
      bar: [],
      value: []
    }
  };
}

/* -------------------------------------------- */

/**
 * Configure which attributes are available for item consumption.
 * @internal
 */
function _configureConsumableAttributes() {
  const altSpells = Object.entries(DND5E.spellPreparationModes).reduce((acc, [k, v]) => {
    if ( !["prepared", "always"].includes(k) && v.upcast ) acc.push(`spells.${k}.value`);
    return acc;
  }, []);

  CONFIG.DND5E.consumableResources = [
    ...Object.keys(DND5E.abilities).map(ability => `abilities.${ability}.value`),
    "attributes.ac.flat",
    "attributes.hp.value",
    ...Object.keys(DND5E.senses).map(sense => `attributes.senses.${sense}`),
    ...Object.keys(DND5E.movementTypes).map(type => `attributes.movement.${type}`),
    ...Object.keys(DND5E.currencies).map(denom => `currency.${denom}`),
    "details.xp.value",
    "resources.primary.value", "resources.secondary.value", "resources.tertiary.value",
    "resources.legact.value", "resources.legres.value",
    ...altSpells,
    ...Array.fromRange(Object.keys(DND5E.spellLevels).length - 1, 1).map(level => `spells.spell${level}.value`)
  ];
}

/* -------------------------------------------- */

/**
 * Configure additional system fonts.
 */
function _configureFonts() {
  Object.assign(CONFIG.fontDefinitions, {
    Roboto: {
      editor: true,
      fonts: [
        { urls: ["systems/dnd5e-2014/fonts/roboto/Roboto-Regular.woff2"] },
        { urls: ["systems/dnd5e-2014/fonts/roboto/Roboto-Bold.woff2"], weight: "bold" },
        { urls: ["systems/dnd5e-2014/fonts/roboto/Roboto-Italic.woff2"], style: "italic" },
        { urls: ["systems/dnd5e-2014/fonts/roboto/Roboto-BoldItalic.woff2"], weight: "bold", style: "italic" }
      ]
    },
    "Roboto Condensed": {
      editor: true,
      fonts: [
        { urls: ["systems/dnd5e-2014/fonts/roboto-condensed/RobotoCondensed-Regular.woff2"] },
        { urls: ["systems/dnd5e-2014/fonts/roboto-condensed/RobotoCondensed-Bold.woff2"], weight: "bold" },
        { urls: ["systems/dnd5e-2014/fonts/roboto-condensed/RobotoCondensed-Italic.woff2"], style: "italic" },
        {
          urls: ["systems/dnd5e-2014/fonts/roboto-condensed/RobotoCondensed-BoldItalic.woff2"], weight: "bold",
          style: "italic"
        }
      ]
    },
    "Roboto Slab": {
      editor: true,
      fonts: [
        { urls: ["systems/dnd5e-2014/fonts/roboto-slab/RobotoSlab-Regular.ttf"] },
        { urls: ["systems/dnd5e-2014/fonts/roboto-slab/RobotoSlab-Bold.ttf"], weight: "bold" }
      ]
    }
  });
}

/* -------------------------------------------- */

/**
 * Configure system status effects.
 */
function _configureStatusEffects() {
  const addEffect = (effects, {special, ...data}) => {
    data = foundry.utils.deepClone(data);
    data._id = utils.staticID(`dnd5e${data.id}`);
    if ( foundry.utils.isNewerVersion(game.version, 12) ) {
      data.img = data.icon ?? data.img;
      delete data.icon;
    }
    effects.push(data);
    if ( special ) CONFIG.specialStatusEffects[special] = data.id;
  };
  CONFIG.statusEffects = Object.entries(CONFIG.DND5E.statusEffects).reduce((arr, [id, data]) => {
    const original = CONFIG.statusEffects.find(s => s.id === id);
    addEffect(arr, foundry.utils.mergeObject(original ?? {}, { id, ...data }, { inplace: false }));
    return arr;
  }, []);
  for ( const [id, {label: name, ...data}] of Object.entries(CONFIG.DND5E.conditionTypes) ) {
    addEffect(CONFIG.statusEffects, { id, name, ...data });
  }
  for ( const [id, data] of Object.entries(CONFIG.DND5E.encumbrance.effects) ) {
    addEffect(CONFIG.statusEffects, { id, ...data, hud: false });
  }
}

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Prepare attribute lists.
 */
Hooks.once("setup", function() {
  // Configure trackable & consumable attributes.
  _configureTrackableAttributes();
  _configureConsumableAttributes();

  CONFIG.DND5E.trackableAttributes = expandAttributeList(CONFIG.DND5E.trackableAttributes);
  game.dnd5e.moduleArt.registerModuleArt();
  Tooltips5e.activateListeners();
  game.dnd5e.tooltips.observe();

  // Register settings after modules have had a chance to initialize
  registerDeferredSettings();

  // Apply table of contents compendium style if specified in flags
  game.packs
    .filter(p => p.metadata.flags?.display === "table-of-contents")
    .forEach(p => p.applicationClass = applications.journal.TableOfContentsCompendium);

  // Apply custom item compendium
  game.packs.filter(p => p.metadata.type === "Item")
    .forEach(p => p.applicationClass = applications.item.ItemCompendium5e);

  // Configure token rings
  CONFIG.DND5E.tokenRings.shaderClass ??= canvas.TokenRingSamplerShaderV11;
  CONFIG.Token.ringClass.initialize();
});

/* --------------------------------------------- */

/**
 * Expand a list of attribute paths into an object that can be traversed.
 * @param {string[]} attributes  The initial attributes configuration.
 * @returns {object}  The expanded object structure.
 */
function expandAttributeList(attributes) {
  return attributes.reduce((obj, attr) => {
    foundry.utils.setProperty(obj, attr, true);
    return obj;
  }, {});
}

/* --------------------------------------------- */

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("i18nInit", () => utils.performPreLocalization(CONFIG.DND5E));

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if ( ["Item", "ActiveEffect"].includes(data.type) ) {
      documents.macro.create5eMacro(data, slot);
      return false;
    }
  });

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;
  const cv = game.settings.get("dnd5e-2014", "systemMigrationVersion") || game.world.flags.dnd5e-2014?.version;
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if ( !cv && totalDocuments === 0 ) return game.settings.set("dnd5e-2014", "systemMigrationVersion", game.system.version);
  if ( cv && !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv) ) return;

  // Compendium pack folder migration.
  if ( foundry.utils.isNewerVersion("3.0.0", cv) ) {
    migrations.reparentCompendiums("DnD5e SRD Content", "D&D SRD Content");
  }

  // Perform the migration
  if ( cv && foundry.utils.isNewerVersion(game.system.flags.compatibleMigrationVersion, cv) ) {
    ui.notifications.error("MIGRATION.5eVersionTooOldWarning", {localize: true, permanent: true});
  }
  migrations.migrateWorld();
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", gameCanvas => {
  if ( game.release.generation < 12 ) {
    gameCanvas.grid.diagonalRule = game.settings.get("dnd5e-2014", "diagonalMovement");
    SquareGrid.prototype.measureDistances = canvas.measureDistances;
  }
  CONFIG.Token.ringClass.pushToLoad(gameCanvas.loadTexturesOptions.additionalSources);
});

/* -------------------------------------------- */
/*  Canvas Draw                                 */
/* -------------------------------------------- */

Hooks.on("canvasDraw", gameCanvas => {
  // The sprite sheet has been loaded now, we can create the uvs for each texture
  CONFIG.Token.ringClass.createAssetsUVs();
});

/* -------------------------------------------- */
/*  System Styling                              */
/* -------------------------------------------- */

Hooks.on("renderPause", (app, [html]) => {
  html.classList.add("dnd5e2");
  const img = html.querySelector("img");
  img.src = "systems/dnd5e-2014/ui/official/ampersand.svg";
  img.className = "";
});

Hooks.on("renderSettings", (app, [html]) => {
  const details = html.querySelector("#game-details");
  const pip = details.querySelector(".system-info .update");
  details.querySelector(".system").remove();

  const heading = document.createElement("div");
  heading.classList.add("dnd5e2", "sidebar-heading");
  heading.innerHTML = `
    <h2>${game.i18n.localize("WORLD.GameSystem")}</h2>
    <ul class="links">
      <li>
        <a href="https://github.com/foundryvtt/dnd5e/releases/latest" target="_blank">
          ${game.i18n.localize("DND5E.Notes")}
        </a>
      </li>
      <li>
        <a href="https://github.com/foundryvtt/dnd5e/issues" target="_blank">${game.i18n.localize("DND5E.Issues")}</a>
      </li>
      <li>
        <a href="https://github.com/foundryvtt/dnd5e/wiki" target="_blank">${game.i18n.localize("DND5E.Wiki")}</a>
      </li>
      <li>
        <a href="https://discord.com/channels/170995199584108546/670336046164213761" target="_blank">
          ${game.i18n.localize("DND5E.Discord")}
        </a>
      </li>
    </ul>
  `;
  details.insertAdjacentElement("afterend", heading);

  const badge = document.createElement("div");
  badge.classList.add("dnd5e2", "system-badge");
  badge.innerHTML = `
    <img src="systems/dnd5e-2014/ui/official/dnd-badge-32.webp" data-tooltip="${dnd5e.title}" alt="${dnd5e.title}">
    <span class="system-info">${dnd5e.version}</span>
  `;
  if ( pip ) badge.querySelector(".system-info").insertAdjacentElement("beforeend", pip);
  heading.insertAdjacentElement("afterend", badge);
});

/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatPopout", documents.ChatMessage5e.onRenderChatPopout);
Hooks.on("getChatLogEntryContext", documents.ChatMessage5e.addChatMessageContextOptions);

Hooks.on("renderChatLog", (app, html, data) => {
  documents.Item5e.chatListeners(html);
  documents.ChatMessage5e.onRenderChatLog(html);
});
Hooks.on("renderChatPopout", (app, html, data) => documents.Item5e.chatListeners(html));

Hooks.on("chatMessage", (app, message, data) => applications.Award.chatMessage(message));

Hooks.on("renderActorDirectory", (app, html, data) => documents.Actor5e.onRenderActorDirectory(html));
Hooks.on("getActorDirectoryEntryContext", documents.Actor5e.addDirectoryContextOptions);

Hooks.on("renderCompendiumDirectory", (app, [html], data) => applications.CompendiumBrowser.injectSidebarButton(html));
Hooks.on("getCompendiumEntryContext", documents.Item5e.addCompendiumContextOptions);
Hooks.on("getItemDirectoryEntryContext", documents.Item5e.addDirectoryContextOptions);

Hooks.on("renderJournalPageSheet", applications.journal.JournalSheet5e.onRenderJournalPageSheet);

Hooks.on("targetToken", canvas.Token5e.onTargetToken);

/* -------------------------------------------- */
/*  Bundled Module Exports                      */
/* -------------------------------------------- */

export {
  applications,
  canvas,
  dataModels,
  dice,
  documents,
  enrichers,
  Filter,
  migrations,
  utils,
  DND5E
};
