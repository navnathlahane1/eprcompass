"use client";
import React, { useState, useRef } from "react";
import BlogHero from "../../components/blog/BlogHero";
import BlogBox from "../../components/blog/BlogBox";
import BlogSpace from "../../components/blog/BlogSpace";
import PopularTags from "../../components/blog/PopularTags";
import EngagementTrend from "../../components/blog/EngagementTrend";
import SubscribeNewsletter from "../../components/blog/SubscribeNewsletter";
import useScrollReveal from "@/components/useScrollReveal";
import { posts as postsData, filterLabels } from "@/lib/blogPosts";

// Add link to each post for listing (detail page URL)
const posts = postsData.map((p) => ({
  ...p,
  link: `/blog/${p.slug}`,
}));

// Get unique tags from all posts
const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

// Sample engagement data
const engagementData = [
  { label: "Jan", value: 1200 },
  { label: "Feb", value: 1800 },
  { label: "Mar", value: 2400 },
];

const BlogPage = () => {
  const [activeFilter, setActiveFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  // Filter logic
  const filteredPosts = posts.filter((post) => {
    const matchesFilter =
      activeFilter === 0 || post.category === filterLabels[activeFilter];
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.summary.toLowerCase().includes(search.toLowerCase());
    const matchesTag =
      !activeTag || (post.tags && post.tags.includes(activeTag));
    return matchesFilter && matchesSearch && matchesTag;
  });

  // Tag click handler
  const handleTagClick = (tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  const heroRef = useRef(null);
  const mainRef = useRef(null);
  const sidebarRef = useRef(null);

  useScrollReveal(heroRef);
  useScrollReveal(mainRef, { delay: 0.1 });
  useScrollReveal(sidebarRef, { delay: 0.2 });

  return (
    <div>
      <div ref={heroRef} className="bg-white dark:bg-black transition-colors duration-500">
        <BlogHero
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchValue={search}
          onSearchChange={setSearch}
        />
      </div>
      <div className="bg-white dark:bg-gray-900 transition-colors duration-500 min-h-screen">
        <BlogSpace
          main={
            <div ref={mainRef} className="grid gap-8 md:grid-cols-2">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, idx) => (
                  <BlogBox key={idx} {...post} />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-lg py-16">
                  No articles found.
                </div>
              )}
            </div>
          }
          sidebar={[
            <div ref={sidebarRef} key="tags">
              <PopularTags
                tags={allTags}
                onTagClick={handleTagClick}
                activeTag={activeTag}
              />
              <EngagementTrend key="trend" data={engagementData} />
              <SubscribeNewsletter key="newsletter" />
            </div>
          ]}
        />
      </div>
    </div>
  );
};

export default BlogPage;