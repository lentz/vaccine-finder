res = "$(curl 'https://www.cvs.com/immunizations/covid-19-vaccine.vaccine-status.VA.json?vaccineinfo' \
  -H 'referer: https://www.cvs.com/immunizations/covid-19-vaccine?icid=cvs-home-hero1-link2-coronavirus-vaccine')"

echo $res | jq '.responsePayloadData.data.VA | map(select(.status == "Available"))[].city' -r | \
  grep '(ASHBURN|LEESBURG|RESTON|HERNDON)'

