# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard 'rspec', :notification => false do
  watch(/^spec\/(.*)_spec.rb/)  { |m| "spec" }
  watch(/^lib\/(.*)\.rb/)                              { |m| "spec" }#"spec/#{m[1]}_spec.rb" }
  watch(/^spec\/spec_helper.rb/)                       { "spec" }
end

# vim:ft=ruby

