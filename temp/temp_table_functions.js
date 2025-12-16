function updateSessionDisplay() {
    const tbody = document.getElementById('sessionTableBody');
    let html = '';

    // Core Identity
    html += '<tr class="section-header"><td colspan="2">📌 Core Identity</td></tr>';
    html += createRow('session_id', sessionId || 'Not created');
    html += createRow('state', sessionData?.state || 'planning');
    html += createRow('created_at', sessionData ? new Date().toLocaleString() : '-');

    // Company Metadata
    html += '<tr class="section-header"><td colspan="2">🏢 Company Metadata</td></tr>';
    html += createRow('company_name', sessionData?.company_metadata?.company_name || '-');

    // Job Metadata
    html += '<tr class="section-header"><td colspan="2">💼 Job Metadata</td></tr>';
    html += createRow('job_title', sessionData?.job_metadata?.job_title || '-');
    html += createRow('job_description', truncate(sessionData?.job_metadata?.job_description, 100));

    // Candidate Metadata
    html += '<tr class="section-header"><td colspan="2">👤 Candidate Metadata</td></tr>';
    html += createRow('candidate_name', sessionData?.candidate_metadata?.candidate_name || '-');
    html += createRow('candidate_email', sessionData?.candidate_metadata?.candidate_email || '-');
    html += createRow('resume', truncate(sessionData?.candidate_metadata?.resume, 100));

    // Interview Config
    html += '<tr class="section-header"><td colspan="2">⚙️ Interview Configuration</td></tr>';
    html += createRow('round_type', sessionData?.interview_metadata?.round_info?.round_type || '-');
    html += createRow('duration_minutes', sessionData?.interview_metadata?.config?.duration_minutes || '-');
    html += createRow('total_questions', sessionData?.interview_metadata?.config?.total_questions || '-');

    // Planning Phase
    html += '<tr class="section-header"><td colspan="2">🎯 Planning Phase Data</td></tr>';

    // Interview Template
    if (generatedPlan?.interview_template) {
        const categories = generatedPlan.interview_template.categories || [];
        html += createRow('interview_template.categories',
            categories.length > 0 ? formatArray(categories.map(c => `${c.category} (${c.depth}, ${c.time_allocation_minutes}min)`)) : 'Not generated',
            categories.length > 0
        );
    } else {
        html += createRow('interview_template', 'Not generated');
    }

    // Interview Plan
    if (generatedPlan?.interview_plan) {
        const questions = generatedPlan.interview_plan.conversation_flow || [];
        html += createRow('interview_plan.questions',
            questions.length > 0 ? `${questions.length} questions generated` : 'Not generated',
            questions.length > 0
        );
        if (questions.length > 0) {
            html += createRow('interview_plan.details', formatArray(questions.map(q => `Q${q.sequence_number}: ${truncate(q.guiding_question, 60)}`)));
        }
    } else {
        html += createRow('interview_plan', 'Not generated');
    }

    // Personalization Insights
    if (generatedPlan?.personalization_insights) {
        const insights = generatedPlan.personalization_insights.resume_jd_alignment;
        if (insights) {
            html += createRow('alignment_score', `${insights.alignment_score}%`, true);
            html += createRow('strong_matches', formatArray(insights.strong_matches));
            html += createRow('gaps', formatArray(insights.gaps));
        }
    } else {
        html += createRow('personalization_insights', 'Not generated');
    }

    // Plan Metadata
    if (generatedPlan?.plan_metadata) {
        html += createRow('confidence_score', `${generatedPlan.plan_metadata.confidence_score}%`, true);
        html += createRow('reasoning', generatedPlan.plan_metadata.reasoning);
    }

    // Critique Feedback
    html += '<tr class="section-header"><td colspan="2">🔍 Critique Feedback</td></tr>';
    if (critiqueResult) {
        html += createRow('quality_score', `${critiqueResult.quality_score}%`, true);
        html += createRow('strengths', formatArray(critiqueResult.strengths));
        html += createRow('concerns', formatArray(critiqueResult.concerns));
        html += createRow('improvements', formatArray(critiqueResult.improvements_suggested));
    } else {
        html += createRow('critique_status', 'Not performed');
    }

    // HITL Feedback
    html += '<tr class="section-header"><td colspan="2">👨‍💼 HITL Feedback</td></tr>';
    if (hitlDecision) {
        html += createRow('hitl_action', hitlDecision.action, true);
        html += createRow('hitl_reason', hitlDecision.reason);
    } else {
        html += createRow('hitl_status', 'Pending review');
    }

    // Observer Insights
    html += '<tr class="section-header"><td colspan="2">🧠 Observer Insights</td></tr>';
    if (hitlDecision) {
        html += createRow('learning_status', 'Patterns extracted', true);
    } else {
        html += createRow('learning_status', 'Not started');
    }

    tbody.innerHTML = html;
}

function createRow(fieldName, value, isUpdated = false) {
    const isEmpty = !value || value === '-' || value === 'Not generated' || value === 'Not performed' || value === 'Not started' || value === 'Pending review';
    const valueClass = isEmpty ? 'field-value empty' : (isUpdated ? 'field-value updated' : 'field-value');

    return `
                <tr>
                    <td class="field-name">${fieldName}</td>
                    <td class="${valueClass}">${value || '-'}</td>
                </tr>
            `;
}

function formatArray(arr) {
    if (!arr || arr.length === 0) return '-';
    return arr.map(item => `<span class="array-item">• ${item}</span>`).join('');
}

function truncate(text, maxLength = 100) {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
