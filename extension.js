
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function getSnippetMode() {
	const cfg = vscode.workspace.getConfiguration()
	return cfg.get('wpSnippets.snippetMode', 'Full')
}

function getSnippetsDir(context) {
	return path.join(context.extensionPath, 'snippets')
}

function getFullSnippetsPath(context) {
	const snippetDir = getSnippetsDir(context)
	return path.join(snippetDir, 'snippets-full.json')
}

function getFlatSnippetsPath(context) {
	const snippetDir = getSnippetsDir(context)
	return path.join(snippetDir, 'snippets-flat.json')
}

function getActiveSnippetsPath(context) {
	const snippetDir = getSnippetsDir(context)
	return path.join(snippetDir, 'snippets.json')
}

function activate(context) {
	console.log('Activated!')
	/**
	 * Use Full Snippets Command
	 * Ensures that the user setting for Snippet Mode is set to Full, 
	 * copies the content of the snippets-full.json file into the snippets.json file, 
	 * then reloads VSCode
	 */
	context.subscriptions.push(vscode.commands.registerCommand('extension.useFullSnippets', async () => {
		// console.log('Switch to Full Snippets')
		await vscode.workspace.getConfiguration().update('wpSnippets.snippetMode', 'Full', vscode.ConfigurationTarget.Global);
		const fullSnippetsPath = getFullSnippetsPath(context);
		const activeSnippetsPath = getActiveSnippetsPath(context);
		try {
			if(fs.existsSync(fullSnippetsPath)) {
				fs.copyFileSync(fullSnippetsPath, activeSnippetsPath);
				vscode.window.showInformationMessage('Switched to Full WordPress Snippets. Reloading window...');
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			} else {
				vscode.window.showErrorMessage('Full snippets file not found.');
			}
		} catch (e) {
			vscode.window.showErrorMessage('Failed to switch snippet file: ' + e.message);
		}
	}));

	/**
	 * Use Flat Snippets Command
	 * Ensures that the user setting for Snippet Mode is set to Flat, 
	 * copies the content of the snippets-flat.json file into the snippets.json file, 
	 * then reloads VSCode
	 */
	context.subscriptions.push(vscode.commands.registerCommand('extension.useFlatSnippets', async () => {
		// console.log('Switch to Flat Snippets')
		await vscode.workspace.getConfiguration().update('wpSnippets.snippetMode', 'Flat', vscode.ConfigurationTarget.Global);
		const flatSnippetsPath = getFlatSnippetsPath(context);
		const activeSnippetsPath = getActiveSnippetsPath(context);
		try {
			if(fs.existsSync(flatSnippetsPath)) {
				fs.copyFileSync(flatSnippetsPath, activeSnippetsPath);
				vscode.window.showInformationMessage('Switched to Flat WordPress Snippets. Reloading window...');
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			} else {
				vscode.window.showErrorMessage('Flat snippets file not found.');
			}
		} catch (e) {
			vscode.window.showErrorMessage('Failed to switch snippet file: ' + e.message);
		}
	}));

	/**
	 * Listen for changes to the snippet mode setting and trigger the respective command
	 */
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		if(event.affectsConfiguration('wpSnippets.snippetMode')) {
			const cfg = vscode.workspace.getConfiguration();
			const snippetMode = cfg.get('wpSnippets.snippetMode', 'Full');
			if(snippetMode === 'Flat') {
				vscode.commands.executeCommand('extension.useFlatSnippets');
			} else {
				vscode.commands.executeCommand('extension.useFullSnippets');
			}
		}
	}));

}

function deactivate() {}

module.exports = { activate, deactivate };