import { readFileSync, writeFileSync } from 'fs';
import { graphql } from '@octokit/graphql';

const token = process.env.GITHUB_TOKEN;
const username = 'd-beloved';

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
   
    let gridLayout = '<table>\n';

    // Process repos in pairs
    for (let i = 0; i < repos.length; i += 2) {
      gridLayout += '  <tr>\n';
      
      // First repo in the pair
      const repo1 = repos[i];
      const badges1 = repo1.languages.nodes.map(lang => 
        getLanguageBadge(lang.name, lang.color)
      ).join(' ');
      
      gridLayout += `    <td width="50%" align="center">
          <a href="${repo1.url}">
            <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo1.name}&theme=maroongold" />
          </a>
          <br />
          <div>${badges1}</div>
        </td>\n`;
      
      // Second repo in the pair (if it exists)
      if (i + 1 < repos.length) {
        const repo2 = repos[i + 1];
        const badges2 = repo2.languages.nodes.map(lang => 
          getLanguageBadge(lang.name, lang.color)
        ).join(' ');
        
        gridLayout += `    <td width="50%" align="center">
            <a href="${repo2.url}">
              <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo2.name}&theme=maroongold" />
            </a>
            <br />
            <div>${badges2}</div>
          </td>\n`;
      } else {
        // If odd number of repos, add empty cell
        gridLayout += '    <td width="50%"></td>\n';
      }
      
      gridLayout += '  </tr>\n';
    }

    gridLayout += '</table>';

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