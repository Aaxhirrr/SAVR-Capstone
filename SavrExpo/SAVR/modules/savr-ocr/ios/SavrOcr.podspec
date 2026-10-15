Pod::Spec.new do |s|
  s.name = 'SavrOcr'
  s.version = '1.0.0'
  s.summary = 'On-device text recognition for SAVR'
  s.description = 'Reads recipe and grocery list images using Apple Vision.'
  s.author = 'SAVR'
  s.homepage = 'https://savr.app'
  s.license = { :type => 'Proprietary' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
