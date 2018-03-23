import sys
import json

def list_packet_timings(packet_data):

	for packet in packet_data:
		try:
			v = packet['_source']['layers']['ip']
		
			if packet['_source']['layers']['ip']['ip.src'] == packet['_source']['layers']['ip']['ip.src_host'] and \
				packet['_source']['layers']['ip']['ip.dst'] == packet['_source']['layers']['ip']['ip.dst_host']:
				pass
			else:
				print("diff")
		except KeyError:
			pass

def list_hosts(packet_data):
	hosts = []

def main(data):
	list_packet_timings(data)
	

if __name__ == '__main__':
	d = json.load(sys.stdin)
	main(d)