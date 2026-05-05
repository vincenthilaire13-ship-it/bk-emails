var template = require('../emails/template');
var emailTemplate = template.emailTemplate;
var blocStats = template.blocStats;
var sectionResto = template.sectionResto;

var DESTINATAIRES = [
  'vincent.hilaire13@gmail.com',
  'Bkdirecteur500@gmail.com',
  'Bkdirecteur509@gmail.com',
  'Bkdirecteur526@gmail.com',
  'tech.bkmontpellier@gmail.com'
];

module.exports = function handler(req, res) {
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  try {
    var now = new Date();
    var moisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var nomMois = moisPrecedent.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Donnees mois — a connecter a Firebase en production
    var restos = {
      '500': { tickets_actifs: [], tickets_resolus_jour: [] },
      '509': { tickets_actifs: [], tickets_resolus_jour: [] },
      '526': { tickets_actifs: [], tickets_resolus_jour: [] }
    };

    var ids = Object.keys(restos);
    var totalActifs = ids.reduce(function(s, r) { return s + restos[r].tickets_actifs.length; }, 0);
    var totalCritiques = ids.reduce(function(s, r) {
      return s + restos[r].tickets_actifs.filter(function(t) { return t.status === 'critique'; }).length;
    }, 0);
    var totalResolus = ids.reduce(function(s, r) { return s + restos[r].tickets_resolus_jour.length; }, 0);

    var contenu = '';

    contenu += '<div style="font-size:12px;font-weight:800;color:#9A9590;text-transform:uppercase;margin-bottom:10px;">BILAN MENSUEL - ' + nomMois.toUpperCase() + '</div>';

    if (totalCritiques > 0) {
      contenu += '<div style="background:#FEE8EC;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #C8102E;">'
        + '<div style="font-weight:800;color:#C8102E;font-size:13px;">URGENT : ' + totalCritiques + ' panne critique</div>'
        + '</div>';
    }

    contenu += blocStats([
      { valeur: totalActifs, label: 'Pannes actives', couleur: '#C8102E' },
      { valeur: totalCritiques, label: 'Critiques', couleur: '#C8102E' },
      { valeur: totalResolus, label: 'Resolues ce mois', couleur: '#1A7D4D' }
    ]);

    // Bilan par restaurant
    contenu += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">';
    contenu += '<tr style="background:#F7F5F0;">';
    contenu += '<td style="padding:8px 12px;font-size:10px;font-weight:800;color:#9A9590;text-transform:uppercase;">RESTAURANT</td>';
    contenu += '<td align="center" style="padding:8px;font-size:10px;font-weight:800;color:#9A9590;text-transform:uppercase;">PANNES</td>';
    contenu += '<td align="center" style="padding:8px;font-size:10px;font-weight:800;color:#9A9590;text-transform:uppercase;">RESOLUES</td>';
    contenu += '</tr>';

    ['500', '509', '526'].forEach(function(rid) {
      var r = restos[rid];
      contenu += '<tr style="border-bottom:1px solid #F0EDE8;">';
      contenu += '<td style="padding:10px 12px;font-weight:700;font-size:13px;">BK ' + rid + '</td>';
      contenu += '<td align="center" style="font-size:14px;font-weight:800;color:#C8102E;">' + r.tickets_actifs.length + '</td>';
      contenu += '<td align="center" style="font-size:14px;font-weight:800;color:#1A7D4D;">' + r.tickets_resolus_jour.length + '</td>';
      contenu += '</tr>';
    });
    contenu += '</table>';

    contenu += '<div style="font-size:12px;font-weight:800;color:#9A9590;text-transform:uppercase;margin-bottom:12px;">DETAIL PAR RESTAURANT</div>';
    ['500', '509', '526'].forEach(function(rid) {
      contenu += sectionResto(rid, restos[rid].tickets_actifs, restos[rid].tickets_resolus_jour);
    });

    var html = emailTemplate({
      titre: 'Bilan mensuel - ' + nomMois,
      sous_titre: 'Rapport mensuel 1er du mois',
      contenu: contenu,
      couleur: '#1050A0'
    });

    var Resend = require('resend').Resend;
    var resend = new Resend(process.env.RESEND_API_KEY);

    return resend.emails.send({
      from: 'BK Technique <onboarding@resend.dev>',
      to: DESTINATAIRES,
      subject: 'BK Technique - Bilan mensuel ' + nomMois,
      html: html
    }).then(function() {
      return res.status(200).json({ success: true, mois: nomMois });
    });

  } catch (error) {
    console.error('[RAPPORT MENSUEL]', error);
    return res.status(500).json({ error: error.message });
  }
};
