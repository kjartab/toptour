Vagrant.configure(2) do |config|


    config.vm.box = "ubuntu/trusty64"

    config.vm.provider "virtualbox" do |v|
      v.memory = 4096
      v.cpus = 4
    end

    config.vm.network :forwarded_port, host: 8011, guest: 80 # Apache
    config.vm.network :forwarded_port, host: 3001, guest: 3000 # ElasticSearch
    #
    # Run Ansible from the Vagrant Host
    # #
    config.ssh.insert_key = false

    # config.vm.provision "shell", inline: 'sudo passwd vagrant -d'

    config.vm.provision "ansible" do |ansible|
        ansible.playbook = "provisioning/deploy.yml" 
        ansible.inventory_path = "provisioning/ansible_hosts"   
        ansible.config.ask_sudo_pass = true
        ansible.limit = "localvagrant"
        # ansible.verbose = "vvvv"
        
    end
end
