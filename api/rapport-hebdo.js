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
    var lundi = new Date(now);
    lundi.setDate(now.getDate() - 7);
    var dimanche = new Date(now);
    dimanche.setDate(now.getDate() - 1);
    var fmt = function(d) {
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
    };
    var periode = fmt(lundi) + ' au ' + fmt(dimanche);

    // Donnees semaine — a connecter a Firebase en production
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

    contenu += '<div style="font-size:12px;font-weight:800;color:#9A9590;text-transform:uppercase;margin-bottom:10px;">BILAN SEMAINE DU ' + periode.toUpperCase() + '</div>';

    if (totalCritiques > 0) {
      contenu += '<div style="background:#FEE8EC;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #C8102E;">'
        + '<div style="font-weight:800;color:#C8102E;font-size:13px;">URGENT : ' + totalCritiques + ' panne critique</div>'
        + '</div>';
    }

    contenu += blocStats([
      { valeur: totalActifs, label: 'Pannes actives', couleur: '#C8102E' },
      { valeur: totalCritiques, label: 'Critiques', couleur: '#C8102E' },
      { valeur: totalResolus, label: 'Resolues', couleur: '#1A7D4D' }
    ]);

    contenu += '<div style="font-size:12px;font-weight:800;color:#9A9590;text-transform:uppercase;margin-bottom:12px;">PANNES PAR RESTAURANT</div>';
    ['500', '509', '526'].forEach(function(rid) {
      contenu += sectionResto(rid, restos[rid].tickets_actifs, restos[rid].tickets_resolus_jour);
    });

    var html = emailTemplate({
      titre: 'Rapport hebdomadaire - Semaine du ' + periode,
      sous_titre: 'Rapport lundi 9h00',
      contenu: contenu,
      couleur: '#1050A0'
    });

    var Resend = require('resend').Resend;
    var resend = new Resend(process.env.RESEND_API_KEY);

    return resend.emails.send({
      from: 'BK Technique <onboarding@resend.dev>',
      to: DESTINATAIRES,
      subject: 'BK Technique - Rapport hebdo ' + periode,
      html: html
    }).then(function() {
      return res.status(200).json({ success: true, periode: periode });
    });

  } catch (error) {
    console.error('[RAPPORT HEBDO]', error);
    return res.status(500).json({ error: error.message });
  }
};
