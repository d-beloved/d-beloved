const fs = require('fs');
const { graphql } = require('@octokit/graphql');

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
          updatedAt
          openGraphImageUrl
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
      const languages = repo.languages.nodes.map(lang => 
        getLanguageBadge(lang.name, lang.color)
      ).join(' ');
      
      gridLayout += `<a href="${repo.url}">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo.name}&theme=radical" />
  </a> `;
      
      // Add line break every 2 repos for better mobile display
      if (repos.indexOf(repo) % 2 === 1) {
        gridLayout += '\n';
      }
    });
    
    // Table layout with more details
    let tableLayout = '<table>\n';
    for (let i = 0; i < repos.length; i += 2) {
      tableLayout += '  <tr>\n';
      
      for (let j = i; j < Math.min(i + 2, repos.length); j++) {
        const repo = repos[j];
        const languages = repo.languages.nodes.map(lang => 
          getLanguageBadge(lang.name, lang.color)
        ).join(' ');
        
        tableLayout += `    <td align="center" width="50%">
      <a href="${repo.url}"><strong>${repo.name}</strong></a>
      <br />
      <br />
      ${languages}
      <br />
      <br />
      <p>${repo.description || 'No description available'}</p>
    </td>\n`;
      }
      
      // If odd number of repos, add empty cell
      if (i + 1 >= repos.length && repos.length % 2 === 1) {
        tableLayout += '    <td width="50%"></td>\n';
      }
      
      tableLayout += '  </tr>\n';
    }
    tableLayout += '</table>';
    
    // Read the current README
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    // Choose which layout you prefer - grid or table
    const chosenLayout = gridLayout; // or tableLayout if you prefer that one
    
    // Replace the featured projects section
    const newReadme = readmeContent.replace(
      /<!-- FEATURED_PROJECTS_START -->[\s\S]*?<!-- FEATURED_PROJECTS_END -->/,
      `<!-- FEATURED_PROJECTS_START -->\n${chosenLayout}\n  <!-- FEATURED_PROJECTS_END -->`
    );
    
    // Write the new README
    fs.writeFileSync('README.md', newReadme);
    
    console.log('README updated successfully with featured projects!');
  } catch (error) {
    console.error('Error updating featured projects:', error);
  }
}

updateReadme();