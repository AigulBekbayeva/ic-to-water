#!/usr/bin/env bash
# Rebuilds data/*.geojson from Natural Earth. Run from the repository root.
# Needs Node.js, `npm i mapshaper`, and these files from
# https://github.com/nvkelso/natural-earth-vector/tree/master/geojson saved into ./raw :
#   ne_10m_glaciated_areas.geojson  ne_50m_admin_0_countries.geojson  ne_50m_lakes.geojson
#   ne_50m_rivers_lake_centerlines.geojson  ne_10m_rivers_lake_centerlines.geojson
set -euo pipefail
MS="npx mapshaper"; R=raw; D=data

# Glaciers: one polygon per feature, region code r (0 = ice sheet), simplified.
$MS $R/ne_10m_glaciated_areas.geojson -explode -require tools/regions.js \
  -each 'r=(name&&/Ice Sheet/.test(name))?0:(rgi(this.centroidX,this.centroidY,1)||(this.centroidY<-60?19:5))' \
  -simplify 14% keep-shapes -filter-fields r -o $R/gl_all.geojson
$MS $R/gl_all.geojson -filter 'r!==0' -o precision=0.001 $R/gl_glaciers.geojson
$MS $R/gl_all.geojson -filter 'r===0' -each 's=this.centroidY>0?1:2' -dissolve s -each 'r=0' -filter-fields r -o precision=0.001 $R/gl_sheets.geojson
$MS -i $R/gl_glaciers.geojson $R/gl_sheets.geojson combine-files -merge-layers force -o $D/glaciers.geojson

# Base layers.
$MS $R/ne_50m_admin_0_countries.geojson -filter-fields NAME,ADM0_A3 -rename-fields name=NAME,a3=ADM0_A3 -simplify 22% keep-shapes -o precision=0.01 $D/countries.geojson
$MS $R/ne_50m_lakes.geojson -filter 'scalerank<=1' -filter-fields name -simplify 30% keep-shapes -o precision=0.01 $D/lakes.geojson
$MS $R/ne_50m_rivers_lake_centerlines.geojson -filter-fields name -simplify 35% -o precision=0.01 $D/rivers_base.geojson

# Glacier-fed rivers for Map 03, tagged with a basin id.
node tools/rivers.js
$MS $R/rivers_glacier_full.geojson -simplify 40% -o precision=0.001 $D/rivers_glacier.geojson
