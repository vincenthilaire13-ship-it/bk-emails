function emailTemplate({ titre, sous_titre, contenu, couleur }) {
  couleur = couleur || '#C8102E';
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>' + titre + '</title></head>'
    + '<body style="margin:0;padding:0;background:#F7F5F0;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:24px 0;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">'
    + '<tr><td style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">'
    + '<div style="font-size:28px;font-weight:900;color:#F5A623;letter-spacing:4px;">BK</div>'
    + '<div style="font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;">Gestion Technique</div>'
    + '<div style="background:' + couleur + ';color:white;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block;margin-top:8px;">' + sous_titre + '</div>'
    + '</td></tr>'
    + '<tr><td style="background:white;padding:24px 32px 0;">'
    + '<h1 style="margin:0;font-size:20px;font-weight:800;color:#1A1A1A;">' + titre + '</h1>'
    + '<div style="height:3px;background:' + couleur + ';border-radius:2px;margin-top:12px;"></div>'
    + '</td></tr>'
    + '<tr><td style="background:white;padding:24px 32px;">' + contenu + '</td></tr>'
    + '<tr><td style="background:#1A1A1A;border-radius:0 0 12px 12px;padding:16px 32px;">'
    + '<div style="color:rgba(255,255,255,0.4);font-size:11px;">Rapport automatique BK Gestion Technique &mdash; Dropbox sync</div>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}

function blocStats(stats) {
  var cells = stats.map(function(s) {
    return '<td align="center" style="background:#F7F5F0;border-radius:8px;padding:14px;">'
      + '<div style="font-size:24px;font-weight:900;color:' + s.couleur + ';">' + s.valeur + '</div>'
      + '<div style="font-size:10px;color:#9A9590;font-weight:600;text-transform:uppercase;margin-top:2px;">' + s.label + '</div>'
      + '</td>';
  }).join('<td width="8"></td>');
  return '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>' + cells + '</tr></table>';
}

function sectionResto(nom, tickets_actifs, tickets_resolus) {
  var critique = tickets_actifs.filter(function(t) { return t.status === 'critique'; }).length;

  var rows = tickets_actifs.map(function(t) {
    var couleur = t.status === 'critique' ? '#C8102E' : t.status === 'en_cours' ? '#B86B00' : '#1050A0';
    var label = t.status === 'critique' ? 'Critique' : t.status === 'en_cours' ? 'En cours' : 'Planifie';
    var pec = t.prise_en_charge ? 'Pris en charge le ' + t.prise_en_charge : 'En attente de prise en charge';
    var interv = t.date_intervention ? ' - Intervention : ' + t.date_intervention : '';
    var cout = t.cout_estime ? '<div style="font-size:10px;color:#B86B00;margin-top:4px;">~' + t.cout_estime + 'euro</div>' : '';
    return '<tr>'
      + '<td style="padding:10px 0;border-bottom:1px solid #F0EDE8;">'
      + '<div style="font-weight:700;font-size:13px;">' + t.app + '</div>'
      + '<div style="font-size:11px;color:#5A5550;">' + t.prob + '</div>'
      + '<div style="font-size:11px;color:' + (t.prise_en_charge ? '#1A7D4D' : '#B86B00') + ';margin-top:4px;">' + pec + interv + '</div>'
      + '</td>'
      + '<td align="right" style="padding:10px 0;border-bottom:1px solid #F0EDE8;vertical-align:top;">'
      + '<span style="background:' + couleur + '22;color:' + couleur + ';padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;">' + label + '</span>'
      + cout
      + '</td></tr>';
  }).join('');

  var resolusHtml = '';
  if (tickets_resolus.length > 0) {
    var items = tickets_resolus.map(function(t) {
      return '<div style="font-size:12px;">OK ' + t.app
        + (t.duree ? ' - ' + t.duree + 'h' : '')
        + (t.cout_reel ? ' - ' + t.cout_reel + 'euro' : '')
        + '</div>';
    }).join('');
    resolusHtml = '<div style="margin-top:10px;padding:10px 12px;background:#E8F5EE;border-radius:8px;">'
      + '<div style="font-size:11px;font-weight:800;color:#1A7D4D;margin-bottom:6px;">RESOLUS (' + tickets_resolus.length + ')</div>'
      + items + '</div>';
  }

  var listeTickets = tickets_actifs.length > 0
    ? '<table width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>'
    : '<div style="text-align:center;padding:16px;color:#9A9590;background:#F7F5F0;border-radius:8px;">Aucun incident actif</div>';

  return '<div style="margin-bottom:20px;">'
    + '<div style="background:#1A1A1A;border-radius:8px;padding:10px 16px;margin-bottom:12px;">'
    + '<span style="font-size:14px;font-weight:800;color:#F5A623;">BK ' + nom + '</span>'
    + (critique > 0 ? '<span style="color:#FF6B6B;font-size:11px;margin-left:12px;">' + critique + ' critique</span>' : '')
    + '</div>'
    + listeTickets
    + resolusHtml
    + '</div>';
}

module.exports = { emailTemplate: emailTemplate, blocStats: blocStats, sectionResto: sectionResto };
