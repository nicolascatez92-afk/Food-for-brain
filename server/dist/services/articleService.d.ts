export interface ArticleData {
    title?: string;
    description?: string;
    content?: string;
    image?: string;
    author?: string;
}
export declare function scrapeArticle(url: string): Promise<ArticleData>;
export declare function generateAISummary(content: string): Promise<string>;
export declare function extractArticleMetadata(url: string): Promise<Partial<ArticleData>>;
//# sourceMappingURL=articleService.d.ts.map