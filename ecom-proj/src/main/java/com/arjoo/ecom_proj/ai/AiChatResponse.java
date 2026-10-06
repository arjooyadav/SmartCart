package com.arjoo.ecom_proj.ai;

import java.util.List;

/** What the assistant sends back: a chat reply plus the actual products it's suggesting. */
public class AiChatResponse {
    private String reply;
    private QueryCriteria interpreted;
    private List<ProductMatch> products;
    private ComparisonResponse comparison;

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public QueryCriteria getInterpreted() { return interpreted; }
    public void setInterpreted(QueryCriteria interpreted) { this.interpreted = interpreted; }
    public List<ProductMatch> getProducts() { return products; }
    public void setProducts(List<ProductMatch> products) { this.products = products; }
    public ComparisonResponse getComparison() { return comparison; }
    public void setComparison(ComparisonResponse comparison) { this.comparison = comparison; }
}
