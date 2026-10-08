import json, cedarpy
schema_text = open('backend/policies/schema.cedarschema').read()
policies_text = 'forbid(principal, action, resource) when { principal.over50_share.greaterThan(decimal("0.30")) }; permit(principal, action, resource);'
request = {'principal': 'HeatShift::Site::"test1"', 'action': 'HeatShift::Action::"ScheduleWork"', 'resource': 'HeatShift::WorkBlock::"block_0"', 'context': {}}
entities = [
    {'uid': {'type': 'HeatShift::Site', 'id': 'test1'}, 'attrs': {'worker_count': 10, 'over50_share': {'__extn': {'fn': 'decimal', 'arg': '0.4000'}}, 'unshaded': False, 'heavy_labor': False}, 'parents': []},
    {'uid': {'type': 'HeatShift::WorkBlock', 'id': 'block_0'}, 'attrs': {'tier': 2, 'start_hour': 8, 'end_hour': 9, 'continuous_minutes': 40, 'intensity': 'moderate'}, 'parents': []}
]
authz_result = cedarpy.is_authorized(request, policies_text, json.dumps(entities), schema_text)
print('Decision:', authz_result.decision)
