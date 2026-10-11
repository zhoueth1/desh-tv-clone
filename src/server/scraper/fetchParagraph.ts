import { translateText } from './translate';

export default async function fetchParagraph(text: string, paragraphNumber: number, type: string) {
  return {
    translatedParagraph: await translateText('bn', 'en', text),
    paragraphNumber,
    type,
  };
}
