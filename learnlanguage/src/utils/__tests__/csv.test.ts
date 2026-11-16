import { describe, it, expect } from 'vitest';
import { parseWordCSV } from '../csv';

describe('CSV Utilities', () => {
  describe('parseWordCSV', () => {
    it('returns empty array for empty string or whitespace', () => {
      expect(parseWordCSV('')).toEqual([]);
      expect(parseWordCSV('   \n  \n')).toEqual([]);
    });

    it('skips header line containing "word" or "kelime"', () => {
      const csv = `Kelime,Çevirisi,Kategori,Örnek Cümle\nbook,kitap,Eğitim,I read a book`;
      const result = parseWordCSV(csv);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        word: 'book',
        translation: 'kitap',
        category: 'Eğitim',
        sentence: 'I read a book'
      });
    });

    it('parses multiple rows correctly', () => {
      const csv = `hello,merhaba,Günlük,Hello world\napple,elma,Meyve,`;
      const result = parseWordCSV(csv);
      expect(result.length).toBe(2);
      expect(result[0].word).toBe('hello');
      expect(result[0].translation).toBe('merhaba');
      expect(result[1].word).toBe('apple');
      expect(result[1].translation).toBe('elma');
      expect(result[1].category).toBe('Meyve');
      expect(result[1].sentence).toBeUndefined();
    });

    it('correctly handles quoted fields containing commas', () => {
      const csv = `"run, fast","hızlı koş",Spor,"Run, run as fast as you can"`;
      const result = parseWordCSV(csv);
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('run, fast');
      expect(result[0].translation).toBe('hızlı koş');
      expect(result[0].category).toBe('Spor');
      expect(result[0].sentence).toBe('Run, run as fast as you can');
    });

    it('ignores rows without translation', () => {
      const csv = `wordOnly\nvalid,gecerli`;
      const result = parseWordCSV(csv);
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('valid');
    });
  });
});

