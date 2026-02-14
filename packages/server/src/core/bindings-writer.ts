/**
 * @vayu/server -- Bindings XML Writer
 *
 * Targeted XML modification for Elite Dangerous `.binds` files.
 * Modifies specific binding elements in place, preserving comments,
 * formatting, and all other content.
 *
 * Features:
 *   - Backup safety: creates `.binds.bak` before the first write in a session
 *   - Write lock: serializes writes to prevent corruption from rapid rebinds
 *   - Targeted regex-based replacement (no full XML rebuild)
 */

import fs from 'fs/promises';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeyBindingUpdate {
  device: string;
  key: string;
  modifiers?: Array<{ device: string; key: string }>;
}

export interface AxisBindingUpdate {
  device: string;
  axis: string;
  inverted?: boolean;
  deadzone?: number;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Whether a backup has been created this session. */
let backupCreated = false;

/** Write lock promise chain for serialization. */
let writeLock: Promise<void> = Promise.resolve();

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[BindingsWriter]';

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

/**
 * Create a backup of the bindings file if one hasn't been created this session.
 */
async function ensureBackup(filePath: string): Promise<void> {
  if (backupCreated) return;

  const bakPath = `${filePath}.bak`;
  try {
    await fs.copyFile(filePath, bakPath);
    backupCreated = true;
    log('Backup created: %s', bakPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('Warning: Could not create backup: %s', msg);
  }
}

// ---------------------------------------------------------------------------
// XML Modification Helpers
// ---------------------------------------------------------------------------

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the XML string for a Primary or Secondary key binding element.
 */
function buildKeyBindingXml(
  slotName: 'Primary' | 'Secondary',
  binding: KeyBindingUpdate | null,
): string {
  if (!binding) {
    return `<${slotName} Device="{NoDevice}" Key="" />`;
  }

  const modifiers = binding.modifiers ?? [];
  if (modifiers.length === 0) {
    return `<${slotName} Device="${binding.device}" Key="${binding.key}" />`;
  }

  const modLines = modifiers
    .map((m) => `\t\t\t<Modifier Device="${m.device}" Key="${m.key}" />`)
    .join('\n');

  return [
    `<${slotName} Device="${binding.device}" Key="${binding.key}">`,
    modLines,
    `\t\t</${slotName}>`,
  ].join('\n');
}

/**
 * Build the XML string for an axis binding (Binding + Inverted + Deadzone).
 */
function buildAxisBindingXml(binding: AxisBindingUpdate | null): string {
  if (!binding) {
    return [
      '<Binding Device="{NoDevice}" Key="" />',
      '\t\t<Inverted Value="0" />',
      '\t\t<Deadzone Value="0.00000000" />',
    ].join('\n');
  }

  const inverted = binding.inverted ? '1' : '0';
  const deadzone = (binding.deadzone ?? 0).toFixed(8);

  return [
    `<Binding Device="${binding.device}" Key="${binding.axis}" />`,
    `\t\t<Inverted Value="${inverted}" />`,
    `\t\t<Deadzone Value="${deadzone}" />`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Core Writers
// ---------------------------------------------------------------------------

/**
 * Update a key binding (Primary or Secondary) for a specific action.
 *
 * @param filePath  Path to the `.binds` file.
 * @param action    Action name (XML element name, e.g. "YawLeftButton").
 * @param slot      Which slot to update: 'primary' or 'secondary'.
 * @param binding   The new binding, or null to unbind.
 */
export async function updateKeyBinding(
  filePath: string,
  action: string,
  slot: 'primary' | 'secondary',
  binding: KeyBindingUpdate | null,
): Promise<void> {
  const execute = async () => {
    await ensureBackup(filePath);

    let xml = await fs.readFile(filePath, 'utf-8');

    const slotName = slot === 'primary' ? 'Primary' : 'Secondary';
    const newSlotXml = buildKeyBindingXml(slotName, binding);

    // Find the action element and replace the specific slot within it.
    // The action block pattern: <ActionName>...content...</ActionName>
    const actionPattern = new RegExp(
      `(<${escapeRegex(action)}>)([\\s\\S]*?)(<\\/${escapeRegex(action)}>)`,
    );

    const actionMatch = xml.match(actionPattern);
    if (!actionMatch) {
      throw new Error(`Action "${action}" not found in bindings file`);
    }

    let actionContent = actionMatch[2];

    // Replace the slot within the action content.
    // Pattern for self-closing slot: <Primary ... />
    // Pattern for slot with children: <Primary ...>...</Primary>
    const slotSelfClosing = new RegExp(
      `<${slotName}\\s[^>]*\\/>`,
    );
    const slotWithChildren = new RegExp(
      `<${slotName}\\s[\\s\\S]*?<\\/${slotName}>`,
    );

    if (slotWithChildren.test(actionContent)) {
      actionContent = actionContent.replace(slotWithChildren, newSlotXml);
    } else if (slotSelfClosing.test(actionContent)) {
      actionContent = actionContent.replace(slotSelfClosing, newSlotXml);
    } else {
      throw new Error(
        `Could not find <${slotName}> element within action "${action}"`,
      );
    }

    xml = xml.replace(
      actionPattern,
      `${actionMatch[1]}${actionContent}${actionMatch[3]}`,
    );

    await fs.writeFile(filePath, xml, 'utf-8');
    log('Updated %s %s binding for %s', action, slot, binding?.key ?? '(cleared)');
  };

  // Serialize via write lock
  writeLock = writeLock.then(execute, execute);
  await writeLock;
}

/**
 * Update an axis binding for a specific action.
 *
 * @param filePath  Path to the `.binds` file.
 * @param action    Action name (XML element name, e.g. "YawAxisRaw").
 * @param binding   The new axis binding, or null to unbind.
 */
export async function updateAxisBinding(
  filePath: string,
  action: string,
  binding: AxisBindingUpdate | null,
): Promise<void> {
  const execute = async () => {
    await ensureBackup(filePath);

    let xml = await fs.readFile(filePath, 'utf-8');

    const newAxisXml = buildAxisBindingXml(binding);

    // Find the action element
    const actionPattern = new RegExp(
      `(<${escapeRegex(action)}>)([\\s\\S]*?)(<\\/${escapeRegex(action)}>)`,
    );

    const actionMatch = xml.match(actionPattern);
    if (!actionMatch) {
      throw new Error(`Action "${action}" not found in bindings file`);
    }

    let actionContent = actionMatch[2];

    // Replace Binding element (self-closing)
    const bindingSelfClosing = /<Binding\s[^>]*\/>/;
    // Replace Binding element (with children — rare but possible)
    const bindingWithChildren = /<Binding\s[\s\S]*?<\/Binding>/;

    if (bindingWithChildren.test(actionContent)) {
      actionContent = actionContent.replace(bindingWithChildren, newAxisXml.split('\n')[0]);
    } else if (bindingSelfClosing.test(actionContent)) {
      actionContent = actionContent.replace(bindingSelfClosing, newAxisXml.split('\n')[0]);
    } else {
      throw new Error(
        `Could not find <Binding> element within action "${action}"`,
      );
    }

    // Replace Inverted element
    const invertedPattern = /<Inverted\s+Value="[^"]*"\s*\/>/;
    const newInvertedXml = newAxisXml.split('\n')[1]?.trim() ?? '<Inverted Value="0" />';
    if (invertedPattern.test(actionContent)) {
      actionContent = actionContent.replace(invertedPattern, newInvertedXml);
    }

    // Replace Deadzone element
    const deadzonePattern = /<Deadzone\s+Value="[^"]*"\s*\/>/;
    const newDeadzoneXml = newAxisXml.split('\n')[2]?.trim() ?? '<Deadzone Value="0.00000000" />';
    if (deadzonePattern.test(actionContent)) {
      actionContent = actionContent.replace(deadzonePattern, newDeadzoneXml);
    }

    xml = xml.replace(
      actionPattern,
      `${actionMatch[1]}${actionContent}${actionMatch[3]}`,
    );

    await fs.writeFile(filePath, xml, 'utf-8');
    log('Updated %s axis binding for %s', action, binding?.axis ?? '(cleared)');
  };

  // Serialize via write lock
  writeLock = writeLock.then(execute, execute);
  await writeLock;
}

/**
 * Reset session backup flag (for testing or manual reset).
 */
export function resetBackupFlag(): void {
  backupCreated = false;
}
