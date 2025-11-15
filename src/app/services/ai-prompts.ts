import { Reporter } from '../models/types';

export class AIPrompts {
  static generateStructuredArticlePrompts(
    reporter: Reporter,
    beatsList: string,
    socialMediaContext: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. ${reporter.prompt}`;

    const userPrompt = `Create a focused news article about one particular recent development. You have access to these beats: ${beatsList}. Choose one beat from this list and focus your article on a recent development within that chosen beat.

First, scan the provided social media messages for information relevant to any of your available beats. Identify the single most significant or noteworthy recent development from these messages that aligns with one of your assigned beats. If there are zero relevant social media messages, stop processing and return empty strings for the rest of the fields.

Focus the entire article on this one specific development, providing in-depth coverage rather than broad overview. Include:

1. A compelling headline focused on this specific development
2. A strong lead paragraph (2-3 sentences) that hooks readers with this particular story
3. A detailed body (300-500 words) with deep context and analysis of this one development
4. 2-4 key quotes specifically related to this development
5. 3-5 credible sources focused on this particular development
6. A brief social media summary (under 280 characters) about this specific story
7. Reporter notes on research quality, source diversity, and factual accuracy for this development
8. beat: Specify which beat from your assigned list you chose for this article
9. messageIds: List the indices (1, 2, 3, etc.) of only the relevant messages you identified and actually used to inform or write this article about this specific development. If you didn't find any relevant messages or didn't use any specific messages, use an empty array.

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible. Focus exclusively on this one development to create a more targeted and impactful piece.${socialMediaContext}

When generating the article, first scan the social media context for messages relevant to your available beats, choose the most appropriate beat for the best story available, identify the most significant single development within that beat, then focus the entire article on that specific development to create a more targeted and impactful story. After writing the article, re-scan the social media messages for any that may be potentially related to your story; include their numeric indices in the "potentialMessageIds" field.`;

    return { systemPrompt, userPrompt };
  }

  static selectNewsworthyStoriesPrompts(
    articlesText: string,
    editorPrompt: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = 'You are an experienced news editor evaluating story newsworthiness. Select the most important and engaging stories based on journalistic criteria.';
    const userPrompt = `Given the following articles and editorial guidelines: "${editorPrompt}", select the 3-5 most newsworthy stories from the list below. Consider factors like timeliness, impact, audience interest, and editorial fit.

Articles:
${articlesText}

Return only the article numbers (1, 2, 3, etc.) of the selected stories, separated by commas. Select between 3-5 articles based on their quality and newsworthiness.`;

    return { systemPrompt, userPrompt };
  }

  static selectNotableEditionsPrompts(
    editionsText: string,
    editorPrompt: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are a newspaper editor creating a comprehensive daily edition. Based on the available newspaper editions and their articles, create a structured daily newspaper with front page content, multiple topics, and editorial feedback. Create engaging, professional content that synthesizes the available editions into a cohesive daily newspaper.`;
    const userPrompt = `Using the editorial guidelines: "${editorPrompt}", create a comprehensive daily newspaper edition based on these available newspaper editions and their articles:

${editionsText}

Generate a complete daily edition with:
1. A compelling front page headline that captures the day's most important story
2. A detailed front page article (300-500 words)
3. 3-5 major topics, each with complete news coverage including headlines, two-paragraph stories, social media content, and contrasting viewpoints
4. Feedback about the editorial prompt (both positive and negative aspects)

Make the content engaging, balanced, and professionally written. Focus on creating a cohesive narrative that connects the various editions into a unified daily newspaper experience.`;

    return { systemPrompt, userPrompt };
  }

  static generateEventsPrompts(
    reporter: Reporter,
    beatsList: string,
    eventsContext: string,
    socialMediaContext: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are an AI journalist tasked with identifying and tracking important events and developments. Your goal is to create structured event records that capture key facts about ongoing stories and developments. You specialize in these beats: ${beatsList}. ${reporter.prompt}`;

    const userPrompt = `Based on the recent social media messages and the reporter's previous events, identify up to 5 significant events or developments that should be tracked. Focus on events and developments that align with your assigned beats: ${beatsList}. For each event:

1. If this matches an existing event from the previous events list, use the existing event's numerical index and add any new facts to it
2. If this is a new event, create a new title and initial facts
3. Each event should have 1-5 key facts that capture the essential information
4. messageIds: List the indices (1, 2, 3, etc.) of only the relevant messages you identified and actually used to create or update this event. If you didn't find any relevant messages or didn't use any specific messages, use an empty array.
5. potentialMessageIds: After creating/updating the event, re-scan the social media messages for any that may be potentially related to this event; include their numeric indices in this field.

Previous Events:
${eventsContext}

Recent Social Media Messages:
${socialMediaContext}

Instructions:
- Review the social media messages for significant developments that align with your assigned beats: ${beatsList}
- Prioritize events and developments within your beats over general news
- Match new information to existing events where appropriate, or create new events for new developments
- For each event, provide a clear title and 1-5 key facts
- Focus on factual, verifiable information
- Prioritize events that represent ongoing stories or important developments within your beats
- Return up to 5 events maximum
- IMPORTANT: Always include messageIds and potentialMessageIds arrays for each event, even if empty
`;

    return { systemPrompt, userPrompt };
  }

  static generateArticlesFromEventsPrompts(
    reporter: Reporter,
    beatsList: string,
    eventsContext: string,
    articlesContext: string,
    socialMediaContext: string
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. ${reporter.prompt}`;

    const userPrompt = `Create a focused news article about one of your recent events. Your assigned beats are as follows: ${beatsList}.

Here are your 5 latest events:
${eventsContext}

Here are the headlines of your 5 latest articles:
${articlesContext}

Choose ONE of the 5 events above and write a comprehensive news article about it. Follow these guidelines:

*First, scan the provided social media messages for information relevant to any of your available beats. If there are zero relevant social media messages, stop processing and return empty strings for the rest of the fields. Include the numerical indexes of the messages relevant to the article you write in the "messageIds" field.
* Write a compelling headline focused on this specific event
* Create a strong lead paragraph (2-3 sentences) that hooks readers with this particular story
* Write a detailed body (300-500 words) with deep context and analysis of this event
* Include 2-4 key quotes specifically related to this event
* List 3-5 credible sources focused on this particular event
* Create a brief social media summary (under 280 characters) about this specific story
* Provide reporter notes on research quality, source diversity, and factual accuracy for this event
* Specify which beat from your assigned list you chose for this article
* IMPORTANT: Do not write about topics you've covered in your recent articles unless there is newly developed information about that topic. If all recent events have been covered, choose the one with the most significant new developments.

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible. Focus exclusively on the chosen event to create a more targeted and impactful piece.${socialMediaContext}

When generating the article, first review your recent articles to avoid repetition, then choose the most appropriate event from your list, and focus the entire article on that specific event to create a more targeted and impactful story. After writing the article, re-scan the social media messages for any that may be related to your chosen event; include their numeric indices in the "potentialMessageIds" field.`;

    return { systemPrompt, userPrompt };
  }
}