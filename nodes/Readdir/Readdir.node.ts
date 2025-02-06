import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { readdirSync } from 'fs';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class Readdir implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Readdir',
		name: 'readdir',
		icon: 'file:./icon.svg',
		group: ['transform'],
		version: 1,
		description: 'Read the contents of a local directory',
		defaults: {
			name: 'Readdir',
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				placeholder: '',
				description: 'Path of a directory on the local filesystem',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let path: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				path = this.getNodeParameter('path', itemIndex, '') as string;
				item = items[itemIndex];

				const entries = readdirSync(path, {
					withFileTypes: true,
				}).map((e) => ({
					name: e.name,
					isDirectory: e.isDirectory(),
					isFile: e.isFile(),
				}));

				item.json.readdir = entries;
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
