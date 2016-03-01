Vagrant.configure(2) do |config|


    config.vm.box = "trusty_daily"

    config.vm.provider "virtualbox" do |v|
      v.memory = 4096
      v.cpus = 4
    end


    
    config.vm.network :forwarded_port, host: 8011, guest: 80 # Apache
    config.vm.network :forwarded_port, host: 3001, guest: 3000 # ElasticSearch
    #
    # Run Ansible from the Vagrant Host
    # #
    # config.vm.provision "ansible" do |ansible|
    #     ansible.playbook = "playbook.yml"
    # end
    
end
