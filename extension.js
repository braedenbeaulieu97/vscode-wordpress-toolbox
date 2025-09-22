const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function stripTabStops(text) {
	if(!text) return text;

	const match = text.match(/^([a-zA-Z0-9_\\]+)\s*\(([^)]*)\)/);
	if(match && (!match[2] || /^\s*$/.test(match[2]))) return `${match[1]}()`;

	if(/\$\{\d+:|(\$\{\d+\})|(\$\d+\b)|(\$0\b)/.test(text)) {
		const fallback = text.match(/^([a-zA-Z0-9_\\]+)\s*\(/);
		if(fallback) return `${fallback[1]}()`;
	}
	return text;
}

/** Load snippets JSON bundled with the extension. */
function loadSnippets(extensionPath) {
  const jsonPath = path.join(extensionPath, 'snippets', 'snippets.json');
  try {
		const raw = fs.readFileSync(jsonPath, 'utf8');
		const data = JSON.parse(raw);
		if(typeof data !== 'object' || !data) throw new Error('Invalid JSON root');
		return data; // { 'Label': { prefix, body, description } }
  } catch (err) {
		console.error('[wp-snippets] Failed to load snippets:', err);
		vscode.window.showErrorMessage('WordPress snippets: failed to load snippets.json. See console for details.');
		return {};
  }
}

/** Build CompletionItems from a snippet map entry. */
function buildItemsFromEntry(label, spec, flatMode) {
  const items = [];
  if(!spec) return items;

  const prefixes = Array.isArray(spec.prefix) ? spec.prefix : [spec.prefix];
  const bodyStr = Array.isArray(spec.body) ? spec.body.join('\n') : String(spec.body ?? '');

  for(const p of prefixes) {
    if(!p) continue;
    const item = new vscode.CompletionItem(p, vscode.CompletionItemKind.Snippet);
    item.detail = label;
    if(spec.description) {
      	item.documentation = new vscode.MarkdownString(spec.description);
    }

    if(flatMode) {
      	item.insertText = stripTabStops(bodyStr);
    } else {
      	item.insertText = new vscode.SnippetString(bodyStr);
    }

    item.sortText = '0_' + p;
    items.push(item);
  }
  return items;
}

function activate(context) {
	vscode.window.showInformationMessage('Minimal extension activated!');

	const snippets = loadSnippets(context.extensionPath);

	const provider = vscode.languages.registerCompletionItemProvider(
		{ language: 'php' },
		{
			provideCompletionItems() {
				const cfg = vscode.workspace.getConfiguration();
				const flat = cfg.get('wpSnippets.removeArguments', false);

				const all = [];
				for(const [label, spec] of Object.entries(snippets)) {
					all.push(...buildItemsFromEntry(label, spec, flat));
				}
				return all;
			}
		},
		'_'
	);

	context.subscriptions.push(provider);

	context.subscriptions.push(
		vscode.window.onDidChangeWindowState(state => {
			if(!state.focused) return;
		})
	);
}

function deactivate() {}

module.exports = { activate, deactivate };