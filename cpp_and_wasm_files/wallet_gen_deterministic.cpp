/*
Input Format (can support as large as 6):
n
(p_safe, p_leak, p_lost, p_stolen)_1
(p_safe, p_leak, p_lost, p_stolen)_2
...
(p_safe, p_leak, p_lost, p_stolen)_n

Output Format:
Number of Evaluated Formulas (should be Dedekind(n))
Best success probability from all possible combination
Best pattern (2^n lines for accept/reject of each state)
*/

#include <stdio.h>
#define ull unsigned long long

double p[7][5],pa[65],pb[65];
double prb[65][65];
int ac[65],rj[65];
ull st_set[8000005],pattern;
double maxn=-1.0;
int n,num;

void enumerate(int cur,ull sta){
	if (cur==(1<<n)){
		st_set[++num]=sta;
		return;
	}
	int tag=0;
	for (int i=0;i<n;i++){
		if ((cur&(1<<i))&&(sta&(1ull<<(cur^(1<<i))))){
			tag=1;
			break;
		}
	}
	sta|=(1ull<<cur);
	enumerate(cur+1,sta);
	if (!tag){
		sta^=(1ull<<cur);
		enumerate(cur+1,sta);
	}
}
	

int main (){
	
	scanf ("%d",&n);
	
	
	for (int i=0;i<n;i++){
		for (int j=0;j<4;j++){
			int x;
			scanf ("%d",&x);
			p[i][j]=0.01*x;
		}
	}
	
	for (int i=0;i<(1<<(2*n));i++){
		int na=0,nb=0;
		double prob=1.0;
		for (int j=0;j<2*n;j+=2){
			int sta=0;
			if (i&(1<<j)){
				sta|=1;
			}
			if (i&(1<<(j+1))){
				sta|=2;
			}
			if (sta==0||sta==1){
				na|=(1<<(j>>1));
			}
			if (sta==1||sta==3){
				nb|=(1<<(j>>1));
			}
			prob*=p[(j>>1)][sta];
		}
		prb[na][nb]+=prob;
	}
	
	enumerate(0,0);
	printf ("Total Number of Boolean Formula: %d\n",num);
	
	for (int i=1;i<=num;i++){
		int n1=0,n2=0;
		for (int j=0;j<(1<<n);j++){
			if (st_set[i]&(1ull<<j)){
				ac[++n1]=j;
			}
			else{
				rj[++n2]=j;
			}
		}
		double ans=0.0;
		for (int j=1;j<=n1;j++){
			for (int k=1;k<=n2;k++){
				ans+=prb[ac[j]][rj[k]];
			}
		}
		if (ans>maxn){
			maxn=ans;
			pattern=st_set[i];
		}
	}
		
		
	
	printf ("Best Probability: %.6lf\n",maxn);
	printf ("Best Boolean Pattern:\n");
	
	for (int i=0;i<(1<<n);i++){
		for (int j=0;j<n;j++){
			if (i&(1<<j)){
				putchar('1');
			}
			else{
				putchar('0');
			}
		}
		putchar(':');
		putchar(' ');
		if (pattern&(1ull<<i)){
			puts("Accept");
		}
		else{
			puts("Reject");
		}
	}
	
	
}

/*
6
90 10 0 0
50 30 20 0
40 40 10 10
80 0 0 20
70 15 5 10
70 5 10 15

emcc wallet_gen_deterministic.cpp -O3 -o wallet_gen_deterministic.wasm -s TOTAL_MEMORY=134217728
*/
	
	

