import { readFileSync, writeFileSync } from 'fs';
import { graphql } from '@octokit/graphql';

const token = process.env.GITHUB_TOKEN;
const username = 'd-beloved'; // Your GitHub username

const query = `{
  user(login: "${username}") {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          homepageUrl
          languages(first: 3) {
            nodes {
              name
              color
            }
          }
          stargazerCount
          forkCount
          updatedAt
        }
      }
    }
  }
}`;

// Helper function to get language badge
const getLanguageBadge = (lang, color) => {
  return `<img src="https://img.shields.io/badge/-${lang}-${color.replace('#', '')}?style=flat-square&logo=${lang.toLowerCase()}&logoColor=white" alt="${lang}"/>`;
};

async function updateReadme() {
  try {
    const { user } = await graphql(query, {
      headers: {
        authorization: `token ${token}`,
      },
    });
    
    const repos = user.pinnedItems.nodes;
    
    // Grid layout with cards
    let gridLayout = '';
    repos.forEach(repo => {
      gridLayout += `<a href="${repo.url}">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo.name}&theme=radical" />
  </a> `;
      
      // Add line break every 2 repos for better mobile display
      if (repos.indexOf(repo) % 2 === 1) {
        gridLayout += '\n';
      }
    });
    
    // Read the current README
    const readmeContent = readFileSync('README.md', 'utf8');
    
    // Replace the featured projects section
    const newReadme = readmeContent.replace(
      /<!-- FEATURED_PROJECTS_START -->[\s\S]*?<!-- FEATURED_PROJECTS_END -->/,
      `<!-- FEATURED_PROJECTS_START -->\n${gridLayout}\n  <!-- FEATURED_PROJECTS_END -->`
    );
    
    // Write the new README
    writeFileSync('README.md', newReadme);
    
    console.log('README updated successfully with featured projects!');
  } catch (error) {
    console.error('Error updating featured projects:', error);
  }
}

updateReadme();