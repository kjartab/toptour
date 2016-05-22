Vagrant.configure(2) do |config|


    config.vm.box = "ubuntu/trusty64"
    config.ssh.insert_key = false

    config.vm.provider "virtualbox" do |v|
      v.memory = 4096
      v.cpus = 4
    end

    config.vm.network :forwarded_port, host: 8014, guest: 80 # Apache
    config.vm.network :forwarded_port, host: 3004, guest: 9200 # ElasticSearch


    config.vm.provision "ansible" do |ansible|
        ansible.playbook = "provision/playbook.yaml"
    end
end