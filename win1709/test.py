import winrm

s = winrm.Session('winnode01.star.k.e2e.bos.redhat.com', auth=('Administrator', 'Secret2018'))
r = s.run_cmd('ipconfig', ['/all'])

