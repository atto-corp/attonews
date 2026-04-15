// // @ts-nocheck
// import { ServiceContainer } from '../services/service-container';
// import { ArtifactType } from '../schemas/types';

// async function createDemoArtifacts() {
//   console.log('Creating demo artifacts...');
//   const container = ServiceContainer.getInstance();
//   const dataStorage = await container.getDataStorageService();

//   // Demo event artifact
//   const eventArtifact = {
//     id: await dataStorage.generateId('artifact'),
//     type: 'event' as ArtifactType,
//     inputs: [
//       {
//         name: 'bluesky',
//         source: 'external' as const,
//         filter: { limit: 10 }
//       }
//     ],
//     prompt_system: 'You are a news reporter. Analyze social media messages for news events.',
//     prompt_user_template: 'Analyze these messages for potential news events:\n{{bluesky.map((msg, i) => `${i+1}. ${msg}`).join(\'\\n\') }}\n\nOutput a JSON array of events.',
//     output: null,
//     metadata: {
//       reporterId: null,
//       status: 'pending' as const,
//       generated_at: null
//     }
//   };

//   // Demo article artifact
//   const articleArtifact = {
//     id: await dataStorage.generateId('artifact'),
//     type: 'article' as ArtifactType,
//     inputs: [
//       {
//         name: 'events',
//         source: 'artifacts' as const,
//         type: 'event' as ArtifactType,
//         filter: { limit: 5, reporterId: 'demo' }
//       },
//       {
//         name: 'bluesky',
//         source: 'external' as const,
//         filter: { limit: 20 }
//       }
//     ],
//     prompt_system: 'You are a journalist writing a news article.',
//     prompt_user_template: 'Write a news article based on these events: {{events.map(e => e.output.title).join(', ')}}\n\nUsing these messages: {{bluesky.join('\n') }}\n\nGenerate: headline, body.',
//     output: null,
//     metadata: {
//       reporterId: 'demo',
//       status: 'pending' as const,
//       generated_at: null
//     }
//   };

//   // Demo edition artifact
//   const editionArtifact = {
//     id: await dataStorage.generateId('artifact'),
//     type: 'edition' as ArtifactType,
//     inputs: [
//       {
//         name: 'articles',
//         source: 'artifacts' as const,
//         type: 'article' as ArtifactType,
//         filter: { limit: 10, since: '3h' }
//       }
//     ],
//     prompt_system: 'You are an editor curating newspaper stories.',
//     prompt_user_template: 'Select the top 5 newsworthy stories from: {{articles.map(a => a.output.headline).join('\n') }}\n\nOutput JSON list of story IDs.',
//     output: null,
//     metadata: {
//       status: 'pending' as const,
//       generated_at: null
//     }
//   };

//   await dataStorage.saveArtifact(eventArtifact);
//   await dataStorage.saveArtifact(articleArtifact);
//   await dataStorage.saveArtifact(editionArtifact);

//   console.log('Demo artifacts created:', eventArtifact.id, articleArtifact.id, editionArtifact.id);
// }

// createDemoArtifacts().catch(console.error).then(() => process.exit(0));
