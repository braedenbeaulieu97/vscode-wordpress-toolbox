
const vscode = require('vscode')
const fs = require('fs')
const path = require('path')

class WordPressSnippetsToolbox {
	context = null
	snippetDir = null
	shownOutOfSyncMessage = false

	/**
	 * The user defined Snippet Mode setting
	 */
	getSnippetModeSetting() {
		const cfg = vscode.workspace.getConfiguration()
		return cfg.get('wpSnippets.snippetMode', 'Full')
	}
	
	/**
	 * The actual snippets file that is being used
	 */
	getCurrentSnippetMode() {
		const activeSnippetsPath = this.getActiveSnippetsPath()
		if(fs.existsSync(activeSnippetsPath)) {
			const content = fs.readFileSync(activeSnippetsPath, 'utf8')
			if(content.includes('${1:\\')) {
				return 'Full'
			} else {
				return 'Flat'
			}
		}
		// if file contains ${1:\\, it's full mode
		return 'Full'
	}
	
	getSnippetsDir() {
		if(this.snippetDir === null) {
			this.snippetDir = path.join(this.context.extensionPath, 'snippets')
		}
		return this.snippetDir
	}
	
	getFullSnippetsPath() {
		const snippetDir = this.getSnippetsDir()
		return path.join(snippetDir, 'snippets-full.json')
	}
	
	getFlatSnippetsPath() {
		const snippetDir = this.getSnippetsDir()
		return path.join(snippetDir, 'snippets-flat.json')
	}
	
	getActiveSnippetsPath() {
		const snippetDir = this.getSnippetsDir()
		return path.join(snippetDir, 'snippets.json')
	}
	
	activate(context) {
		this.context = context

		// console.log('Activated!')
	
		/**
		 * Check if the setting and the actual snippets file are out of sync
		 * If so, prompt the user to run the action that will update the snippets.json file to their chosen setting. (Full or Flat)
		 */
		const snippetModeSetting = this.getSnippetModeSetting()
		const currentSnippetMode = this.getCurrentSnippetMode()
		if(snippetModeSetting !== currentSnippetMode) {
			this.shownOutOfSyncMessage = true

			vscode.window.showWarningMessage(
				`Your chosen WordPress Snippet set is out of sync. Press "Reload now" to fix this.`,
				{ modal: true },
				'Reload Now', 'Ignore'
			).then(selection => {
				if(selection === 'Reload Now') {
					if(snippetModeSetting === 'Flat') {
						vscode.commands.executeCommand('extension.useFlatSnippets')
					} else {
						vscode.commands.executeCommand('extension.useFullSnippets')
					}
				}
			})
		} else if(this.shownOutOfSyncMessage = true) {
			this.shownOutOfSyncMessage = false
		}
	
		/**
		 * Use Full Snippets Command
		 * Ensures that the user setting for Snippet Mode is set to Full, 
		 * copies the content of the snippets-full.json file into the snippets.json file, 
		 * then reloads VSCode
		 */
		this.context.subscriptions.push(vscode.commands.registerCommand('extension.useFullSnippets', async () => {
			// console.log('Switch to Full Snippets')
			await vscode.workspace.getConfiguration().update('wpSnippets.snippetMode', 'Full', vscode.ConfigurationTarget.Global)
			const fullSnippetsPath = this.getFullSnippetsPath()
			const activeSnippetsPath = this.getActiveSnippetsPath()
			try {
				if(fs.existsSync(fullSnippetsPath)) {
					fs.copyFileSync(fullSnippetsPath, activeSnippetsPath)
					vscode.window.showInformationMessage('Switched to Full WordPress Snippets. Reloading window...')
					vscode.commands.executeCommand('workbench.action.reloadWindow')
				} else {
					vscode.window.showErrorMessage('Full snippets file not found.')
				}
			} catch (e) {
				vscode.window.showErrorMessage('Failed to switch snippet file: ' + e.message)
			}
		}))
	
		/**
		 * Use Flat Snippets Command
		 * Ensures that the user setting for Snippet Mode is set to Flat, 
		 * copies the content of the snippets-flat.json file into the snippets.json file, 
		 * then reloads VSCode
		 */
		this.context.subscriptions.push(vscode.commands.registerCommand('extension.useFlatSnippets', async () => {
			// console.log('Switch to Flat Snippets')
			await vscode.workspace.getConfiguration().update('wpSnippets.snippetMode', 'Flat', vscode.ConfigurationTarget.Global)
			const flatSnippetsPath = this.getFlatSnippetsPath()
			const activeSnippetsPath = this.getActiveSnippetsPath()
			try {
				if(fs.existsSync(flatSnippetsPath)) {
					fs.copyFileSync(flatSnippetsPath, activeSnippetsPath)
					vscode.window.showInformationMessage('Switched to Flat WordPress Snippets. Reloading window...')
					vscode.commands.executeCommand('workbench.action.reloadWindow')
				} else {
					vscode.window.showErrorMessage('Flat snippets file not found.')
				}
			} catch (e) {
				vscode.window.showErrorMessage('Failed to switch snippet file: ' + e.message)
			}
		}))
	
		/**
		 * Listen for changes to the snippet mode setting and trigger the respective command
		 */
		context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
			if(event.affectsConfiguration('wpSnippets.snippetMode')) {
				const cfg = vscode.workspace.getConfiguration()
				const snippetMode = cfg.get('wpSnippets.snippetMode', 'Full')
				if(snippetMode === 'Flat') {
					vscode.commands.executeCommand('extension.useFlatSnippets')
				} else {
					vscode.commands.executeCommand('extension.useFullSnippets')
				}
			}
		}))
	
	}
	
	deactivate() {}
}

let wordPressSnippetsToolbox = new WordPressSnippetsToolbox()

module.exports = {
	activate: wordPressSnippetsToolbox.activate.bind(wordPressSnippetsToolbox),
	deactivate: wordPressSnippetsToolbox.deactivate.bind(wordPressSnippetsToolbox)
}