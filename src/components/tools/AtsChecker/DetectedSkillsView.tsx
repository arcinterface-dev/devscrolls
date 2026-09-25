import React from 'react';
import type { DetectedSkillGroup } from '../../../lib/ats/types';

interface DetectedSkillsViewProps {
  skills: DetectedSkillGroup[];
}

export const DetectedSkillsView: React.FC<DetectedSkillsViewProps> = ({ skills }) => {
  const totalSkills = skills.reduce((acc, g) => acc + g.skills.length, 0);

  return (
    <div className="ats-card ats-skills-section">
      <div className="ats-card-header">
        <div className="ats-card-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <h3>Detected Technical Competencies</h3>
        </div>
        <span className="ats-card-header-badge">{totalSkills} Skills Indexed</span>
      </div>

      <p className="ats-section-desc">
        ATS algorithms extract these keywords to calculate match percentages against job descriptions.
      </p>

      {skills.length === 0 ? (
        <div className="ats-no-skills-warning">
          <p>No recognized technical keywords were detected. Be sure to list your primary programming languages and frameworks in a dedicated "Technical Skills" section.</p>
        </div>
      ) : (
        <div className="ats-skills-groups">
          {skills.map((group) => (
            <div key={group.category} className="ats-skill-group">
              <span className="ats-group-title">{group.category}</span>
              <div className="ats-skill-tags">
                {group.skills.map((skill) => (
                  <span key={skill} className="ats-skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
